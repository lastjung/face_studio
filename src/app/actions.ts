'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { headers } from 'next/headers';
import { encrypt } from '@/utils/encryption'; // Import Encryption

// --- Configuration ---
// Strategy: Vision-to-Prompt Bridge (Stable)
// 1. Gemini 2.5 (Vision): Analyzes user image -> Generates detailed text description.
// 2. Imagen 4.0 (Generation): Receives text prompt + description -> Generates high-quality image.
// This works around the lack of direct "Image-to-Image" API support in the current public tier.
const PRIMARY_MODEL = "imagen-4.0-generate-001";
const VISION_MODEL = "gemini-2.5-flash";

const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// --- Server Actions for Credits ---

import { createAdminClient } from '@/utils/supabase/admin';

export async function purchaseCredit(planId: string) {
    const supabase = await createClient(); // For Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) return { success: false, error: "Unauthorized" };

    try {
        const adminSupabase = createAdminClient(); // For DB Write (Bypass RLS)

        // 1. Fetch Plan Details (Public is fine, but admin is safer)
        const { data: plan, error: planError } = await adminSupabase
            .from('pricing_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (planError || !plan) throw new Error("Invalid Plan");

        // 2. Add Credit Source (FIFO) - Using Admin Client
        const { error: sourceError } = await adminSupabase
            .from('credit_sources')
            .insert({
                user_id: user.id,
                plan_id: plan.id,
                initial_credits: plan.credits,
                remaining_credits: plan.credits,
                status: 'active'
            });

        if (sourceError) throw new Error(`Failed to create credit source: ${sourceError.message}`);

        // 3. Log Transaction - Using Admin Client
        const { error: txError } = await adminSupabase
            .from('credit_transactions')
            .insert({
                user_id: user.id,
                amount: plan.credits,
                type: 'purchase',
                description: `Purchased ${plan.name} Plan`
            });

        if (txError) console.error("Transaction log failed", txError);

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function requestRefund(sourceId: string, reason: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) return { success: false, error: "Unauthorized" };

    try {
        // 1. Validate Eligibility
        const { data: source, error: sourceError } = await supabase
            .from('credit_sources')
            .select('*')
            .eq('id', sourceId)
            .eq('user_id', user.id)
            .single();

        if (sourceError || !source) throw new Error("Invalid Credit Source");

        if (source.remaining_credits !== source.initial_credits) {
            throw new Error("Cannot refund partially used credits.");
        }

        const purchaseDate = new Date(source.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (purchaseDate < sevenDaysAgo) {
            throw new Error("Refund period (7 days) has expired.");
        }

        if (source.status !== 'active') {
            throw new Error("Credit source is not active.");
        }

        // 2. Create Refund Request
        const { error: refundError } = await supabase
            .from('refund_requests')
            .insert({
                user_id: user.id,
                source_id: sourceId,
                reason: reason,
                status: 'pending'
            });

        if (refundError) throw new Error("Failed to create refund request.");

        // 3. Update Source Status (Lock credits)
        const { error: updateError } = await supabase
            .from('credit_sources')
            .update({ status: 'pending_refund' })
            .eq('id', sourceId);

        if (updateError) throw new Error("Failed to update credit source status.");

        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Types ---
interface GenerationResult {
    success: boolean;
    imageUrl?: string | null;
    imageUrls?: string[]; // Array support for multiple images
    analysis?: string;
    modelUsed?: string;
    errorLogs?: string[];
    error?: string;
}

// --- Credit System Logic ---

// FIFO Logic: Deduct credits from oldest active sources first
async function deductCredits(userId: string, cost: number, dbImageId?: string): Promise<void> {
    const adminSupabase = createAdminClient();

    // 1. Check Total Balance
    const { data: profile, error: profileError } = await adminSupabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (profileError || !profile) throw new Error("Failed to fetch user profile.");
    if (profile.credits < cost) throw new Error(`Insufficient credits. Required: ${cost}, Available: ${profile.credits}`);

    // 2. Fetch Active Sources (FIFO: Oldest First)
    const { data: sources, error: sourcesError } = await adminSupabase
        .from('credit_sources')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('remaining_credits', 0)
        .order('created_at', { ascending: true });

    if (sourcesError || !sources) throw new Error("Failed to fetch credit sources.");

    let remainingCost = cost;
    const deductionLog = [];

    // 3. FIFO Deduction Loop
    for (const source of sources) {
        if (remainingCost <= 0) break;

        const deductAmount = Math.min(source.remaining_credits, remainingCost);

        // Update Source
        const { error: updateError } = await adminSupabase
            .from('credit_sources')
            .update({ remaining_credits: source.remaining_credits - deductAmount })
            .eq('id', source.id);

        if (updateError) throw new Error(`Failed to update credit source ${source.id}`);

        remainingCost -= deductAmount;
        deductionLog.push({ source_id: source.id, amount: deductAmount });
    }

    if (remainingCost > 0) {
        throw new Error("Critical Error: Calculated credits enough but active sources insufficient.");
    }

    // 4. Record Transaction (Ledger)
    const { data: transaction, error: txError } = await adminSupabase
        .from('credit_transactions')
        .insert({
            user_id: userId,
            amount: -cost,
            type: 'usage',
            description: `Image Generation (${cost} credits)`
        })
        .select()
        .single();

    if (txError) console.error("Failed to log transaction:", txError);

    // 5. Record Consumption Details
    if (transaction) {
        const consumptionRecords = deductionLog.map(log => ({
            user_id: userId,
            source_id: log.source_id,
            transaction_id: transaction.id,
            amount_deducted: log.amount,
            image_id: dbImageId || null
        }));

        const { error: consError } = await adminSupabase
            .from('credit_consumption')
            .insert(consumptionRecords);

        if (consError) console.error("Failed to log consumption details:", consError);
    }
}

export async function generateImage(formData: FormData): Promise<GenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY is missing.");
        return { success: false, error: "Server configuration error: API Key missing.", errorLogs: [] };
    }

    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;
    const style = formData.get('style') as string || '사실적';
    const aspectRatio = formData.get('aspectRatio') as string || "1:1";
    // TODO: Get cost from formData based on selected model quality (Turbo=1, Standard=2, Pro=3)
    const COST = 2; // Default Standard Cost

    const errorLogs: string[] = [];

    if (!prompt) return { success: false, error: 'Prompt is required', errorLogs: [] };

    let faceDescription = "";
    let finalPrompt = prompt;

    // --- Step 0: Check Credits (Fail Fast) ---
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
        return { success: false, error: "Unauthorized: Please log in.", errorLogs: [] };
    }

    // Quick Balance Check (Optimization)
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    if (profile && profile.credits < COST) {
        return { success: false, error: `Not enough credits. Required: ${COST}, You have: ${profile.credits}`, errorLogs: [] };
    }


    try {
        // --- PREPARE EXTENDED SETTINGS ---
        const framing = formData.get('framing') as string || "전신";
        let negativePrompt = formData.get('negativePrompt') as string || "";
        const imageCount = parseInt(formData.get('imageCount') as string || "1");

        // --- PREPARE FRAMING & STYLE ---
        let framingKeywords = "";

        // Dynamic Negative Prompt Injection (CRITICAL for Framing Control)
        switch (framing) {
            case '얼굴 위주':
                // 1. Face (Close-up): Intimate portrait, detailed features, 1m distance.
                framingKeywords = "Close-up face shot, face filling the frame, highly detailed eyes and skin texture, intimate portrait";
                negativePrompt += ", full body, wide shot, far away, standing, legs, shoes, torso, waist, neck only, bust shot, shoulders visible";
                break;
            case '가슴 위':
                // 2. Bust (Head & Shoulders): Medium close-up, ensuring chest/shoulders are visible to prevent 'floating head'.
                framingKeywords = "Medium close-up, Bust shot, Head and Chest visible, chest and shoulders fully visible, passport photo composition";
                negativePrompt += ", full body, legs, shoes, waist, hips, extreme close-up, macro, chin only, face only, text, watermark, close up face only";
                break;
            case '상반신':
                // 3. Waist Up (Mid-Shot): Belt-line crop. Strong anti-text prompts to prevent 'stats/UI' artifacts.
                framingKeywords = "Mid-shot, Waist Up portrait, belt line visible, hands visible, clean background, high quality photo";
                negativePrompt += ", full body, legs, shoes, knees, hips, extreme close-up, head shot, face shot, character sheet, stats, text, writing, ui, interface, infobox, typography, letters";
                break;
            case '무릎 위':
                // 4. Knee Up (American Shot): 3/4 length, thighs and knees visible, natural standing pose.
                framingKeywords = "American shot, Cowboy shot, View from knees up, thighs visible, knees visible, standing natural pose, 3/4 length portrait";
                negativePrompt += ", full body, shoes, feet, extreme close-up, head shot, face shot, bust shot, waist up only, close up";
                break;
            case '전신':
            default:
                // 5. Full Body (Wide Shot): Head-to-toe. 'Small subject' forced to prevent cropping in 1:1 aspect ratio.
                framingKeywords = "Wide shot, Full body photograph, entire figure visible from head to toe, subject small in frame, lots of headroom and footroom, shoes visible";
                negativePrompt += ", close up, face shot, bust shot, cropped, zoomed in, head only, portrait, extreme close-up, waist up, knee up, illustration, anime, 3d render, painting, cropped legs, cropped feet";
                break;
        }

        let styleKeywords = "";
        switch (style) {
            case '사실적':
                styleKeywords = "8k resolution, raw photo, dslr, 85mm lens, depth of field, bokeh, soft lighting, neutral lighting, white balance, high detail, film grain, Fujifilm XT3, photorealistic";
                negativePrompt += ", anime, illustration, 3d render, vector art, painting, drawing, cartoon, semi-realistic, cgi";
                break;
            case '일러스트':
                styleKeywords = "digital illustration, concept art, trending on artstation, very detailed, smooth, vibrant colors, clean lines, fantasy art style";
                break;
            case '애니메이션':
                styleKeywords = "anime style, japanese animation, makoto shinkai style, studio ghibli, vibrant, 2d, cel shading, detailed backgrounds";
                break;
            case '수채화':
                styleKeywords = "watercolor painting, wet on wet, soft blending, artistic, dreamy, pastel colors, paper texture, traditional media";
                break;
            case '유화':
                styleKeywords = "oil painting, thick brush strokes, canvas texture, impressionism, fine art, traditional art, rich colors";
                break;
            default:
                styleKeywords = "high quality, photorealistic";
        }

        // --- Step 1: Vision Analysis (If image provided) ---
        if (imageFile) {
            try {
                // ... (Vision Logic) ...
                const arrayBuffer = await imageFile.arrayBuffer();
                const imageBase64 = Buffer.from(arrayBuffer).toString('base64');

                const genAI = new GoogleGenerativeAI(apiKey);
                const visionModel = genAI.getGenerativeModel({ model: VISION_MODEL });

                const analysisPrompt = "Analyze the physical identity of this face to reproduce the resemblance. Describe age, gender, facial structure, eye shape, nose shape, and key features. Do NOT describe skin texture or tiny details that require a close-up.";

                const visionResult = await visionModel.generateContent([
                    analysisPrompt,
                    { inlineData: { data: imageBase64, mimeType: imageFile.type } }
                ]);

                faceDescription = visionResult.response.text();

                // Aggressive Prompt Engineering for Framing Control
                let faceInstruction = `The subject has: ${faceDescription}`;

                if (framing !== '얼굴 위주') {
                    faceInstruction = `(The subject is shown in a wider shot. Do not zoom in, but ensure facial features are consistent with this description): ${faceDescription} \n(Ensure the age and physical traits match this description, overriding generic archetype traits from the prompt if they differ.)`;
                }

                let masterSuffix = "";
                if (framing === '전신') masterSuffix = " - ZOOM OUT - WHOLE FIGURE VISIBLE";
                if (framing === '무릎 위') masterSuffix = " - MEDIUM LONG SHOT - KNEES UP VISIBLE";
                if (framing === '상반신') masterSuffix = " - ZOOM OUT - WAIST UP VISIBLE (DO NOT CROP TO HEAD)";
                if (framing === '가슴 위') masterSuffix = " - BUST SHOT - SHOULDERS VISIBLE";
                if (framing === '얼굴 위주') masterSuffix = " - EXTREME CLOSE UP - FACE ONLY";

                finalPrompt = `
[MASTER INSTRUCTION: ${framingKeywords.toUpperCase()}${masterSuffix}]

[SCENE CONTENT]
${prompt}

[CHARACTER DETAILS - FACE REFERENCE ONLY]
${faceInstruction}

[STYLE]
${styleKeywords}

[COMPOSITION CHECK]
Ensure the image matches the MASTER INSTRUCTION.
If 'Full Body', show SHOES and HEAD.
If 'Upper Body', show WAIST UP.
Do not let the face explanation dictate the framing.
`;

            } catch (visionError: any) {
                console.warn(`Vision analysis failed: ${visionError.message}`);
                errorLogs.push(`Vision Analysis Failed: ${visionError.message}`);
                finalPrompt = `${prompt}, ${styleKeywords}`;
            }
        } else {
            // Text Only Mode
            finalPrompt = `[MASTER INSTRUCTION: ${framingKeywords}]\n${prompt}\n[STYLE summary]: ${styleKeywords}`;
        }

        // --- Step 2: Image Generation (Imagen 4.0 via REST) ---
        try {

            // Append Negative Prompts to the main prompt cleanly
            if (negativePrompt.trim()) {
                const cleanedNegative = negativePrompt.replace(/^,\s*/, ''); // Remove leading comma
                finalPrompt += ` \n\nExclude elements: ${cleanedNegative}`;
            }

            const payload = {
                instances: [
                    { prompt: finalPrompt }
                ],
                parameters: {
                    sampleCount: imageCount,
                    aspectRatio: aspectRatio,
                    personGeneration: "allow_adult",
                }
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${PRIMARY_MODEL}:predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                // console.error(`Imagen API Error (${response.status}):`, errorText);
                throw new Error(`Google API Error ${response.status}: ${errorText || response.statusText}`);
            }

            const data = await response.json();

            if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {

                const base64Image = data.predictions[0].bytesBase64Encoded;
                let publicUrl = `data:image/png;base64,${base64Image}`; // Default fallback
                let saveError = null;

                // --- Step 3: Supabase Storage & Persistence ---
                try {
                    // console.log(`[Phase 3] Uploading to Supabase Storage for user ${user.id}...`);

                    // 1. Convert Base64 -> Buffer
                    const imageBuffer = Buffer.from(base64Image, 'base64');

                    // 2. Upload to Storage
                    const fileName = `${user.id}/${Date.now()}_${uuidv4()}.png`;
                    const { error: uploadError } = await supabase.storage
                        .from('generated_images')
                        .upload(fileName, imageBuffer, {
                            contentType: 'image/png',
                            upsert: false
                        });

                    let savedImageId = undefined;

                    if (uploadError) {
                        console.error("Storage Upload Error:", uploadError);
                        saveError = "Failed to upload image to storage.";
                    } else {
                        // 3. Get Public URL
                        const { data: { publicUrl: storageUrl } } = supabase.storage
                            .from('generated_images')
                            .getPublicUrl(fileName);

                        publicUrl = storageUrl; // Update to real URL

                        // 4. Insert into DB
                        const { data: insertedImage, error: dbError } = await supabase
                            .from('images')
                            .insert({
                                user_id: user.id,
                                prompt: prompt, // Original user prompt
                                model: PRIMARY_MODEL,
                                storage_path: fileName,
                                storage_url: storageUrl,
                                face_description: faceDescription, // Analysis result
                                final_prompt: finalPrompt // The actual full prompt sent to Imagen
                            })
                            .select('id')
                            .single();

                        if (dbError) {
                            console.error("DB Insert Error:", dbError);
                            saveError = "Image saved to storage but failed to record in DB.";
                        } else {
                            savedImageId = insertedImage.id;
                            // console.log("Successfully saved image to DB and Storage!");

                            // --- Step 4: Deduct Credits (FIFO) ---
                            try {
                                await deductCredits(user.id, COST, savedImageId);
                                // console.log(`[Credit] Deducted ${COST} credits for user ${user.id}`);
                            } catch (creditError: any) {
                                console.error("Credit Deduction Failed:", creditError);
                                // Note: Image was generated and saved, but credit deduction failed. 
                                // In production, we might want to flag this or rollback (delete image).
                                saveError = `Credit Error: ${creditError.message}`;
                            }
                        }
                    }


                } catch (storageErr: any) {
                    console.error("Persistence Error:", storageErr);
                    saveError = `Persistence failed: ${storageErr.message}`;
                    errorLogs.push(saveError);
                }

                return {
                    success: true,
                    imageUrl: publicUrl,
                    // Show transparency: What the user asked + What the Vision AI added
                    analysis: `[Used ${PRIMARY_MODEL} - Cost: ${COST} Credits]\n\n**Included Face Description:**\n${faceDescription || "(No image reference used)"}\n\n**Final Prompt:**\n${finalPrompt}`,
                    modelUsed: PRIMARY_MODEL,
                    errorLogs: saveError ? [...errorLogs, saveError] : errorLogs
                };
            } else {
                console.error("Gemini/Imagen API Raw Response:", JSON.stringify(data, null, 2));

                // Handle Safety Filter / Empty Response (Common when prompt violates guidelines slightly)
                if (!data || Object.keys(data).length === 0 || !data.predictions) {
                    throw new Error("이미지를 생성할 수 없습니다. (안전 필터 또는 프롬프트 문제). 다른 스타일이나 프롬프트로 시도해 주세요.");
                }

                const failureReason = data.error?.message || JSON.stringify(data).substring(0, 200);
                throw new Error(`Generation failed by model. Details: ${failureReason}`);
            }

        } catch (genError: any) {
            console.error(`Generation failed: ${genError.message}`);
            throw genError; // Throw to outer catch
        }

    } catch (error: any) {
        console.error('Workflow failed:', error);
        return {
            success: false,
            error: error.message || 'Unknown error occurred',
            errorLogs: [...errorLogs, error.message]
        };
    }
}
// --- Toss Payments Logic ---

export async function confirmTossPayment(orderId: string, paymentKey: string, amount: number, planId: string) {
    const supabase = await createClient(); // For Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) return { success: false, error: "Unauthorized" };

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) return { success: false, error: "Server Configuration Error" };

    try {
        // 1. Verify Payment with Toss API
        const encryptedSecretKey = "Basic " + Buffer.from(secretKey + ":").toString('base64');
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
            method: 'POST',
            headers: {
                Authorization: encryptedSecretKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: orderId,
                amount: amount,
                paymentKey: paymentKey,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Payment Confirmation Failed:", data);
            return { success: false, error: data.message || "Payment Confirmation Failed" };
        }

        // 2. Add Credits (using Admin Client)
        const adminSupabase = createAdminClient();

        // 2.1 Fetch Plan to confirm credit amount
        const { data: plan, error: planError } = await adminSupabase
            .from('pricing_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (planError || !plan) {
            // Money paid but plan not found. Critical log needed.
            console.error(`CRITICAL: Money paid (${amount}) but plan ${planId} not found.`);
            return { success: false, error: "Payment successful but failed to find plan details. Please contact support." };
        }

        // 2.2 Add Credit Source
        const { error: sourceError } = await adminSupabase
            .from('credit_sources')
            .insert({
                user_id: user.id,
                plan_id: plan.id,
                initial_credits: plan.credits,
                remaining_credits: plan.credits,
                status: 'active'
            });

        if (sourceError) {
            console.error(`CRITICAL: Payment confirmed but failed to add source: ${sourceError.message}`);
            return { success: false, error: "Payment successful but credit add failed. Please contact support." };
        }

        // 2.3 Log Transaction
        await adminSupabase.from('credit_transactions').insert({
            user_id: user.id,
            amount: plan.credits,
            type: 'purchase',
            description: `Purchased ${plan.name} (${data.method})`
        });

        // 2.4 Log Payment History (Fix for Missing Data)
        const { error: paymentError } = await adminSupabase.from('payment_history').insert({
            user_id: user.id,
            amount: amount,
            currency: 'KRW',
            status: 'succeeded',
            provider: 'toss', // or data.method if specific
        });

        if (paymentError) {
            console.error("Payment History Log Failed:", paymentError);
            // Non-critical, but good to know
        }

        return { success: true };

    } catch (error: any) {
        console.error("Confirm Payment Error:", error);
        return { success: false, error: error.message };
    }
}
// --- User Management ---

export async function withdrawUser() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) return { success: false, error: "Unauthorized" };

    try {
        // 1. Soft Delete Profile
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);

        // 2. Sign Out
        await supabase.auth.signOut();

        return { success: true };

    } catch (error: any) {
        console.error("Withdrawal Error:", error);
        return { success: false, error: error.message };
    }
}

// --- Activity Logging ---

export async function logActivity(
    actionType: 'LOGIN' | 'LOGOUT' | 'PAGE_VISIT',
    path?: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return; // Only log for authenticated users

    try {
        // Collect Metadata
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        // Encrypt Sensitive Data
        // IP Address is Personal Identifiable Information (PII)
        const encryptedIp = encrypt(ip);

        const { error } = await supabase.from('activity_logs').insert({
            user_id: user.id,
            action_type: actionType,
            path: path || null,
            ip_address: encryptedIp, // Store Encrypted
            user_agent: userAgent
        });

        if (error) {
            console.error("Activity Log Error:", error);
        }
    } catch (err) {
        // Fail silently to not disrupt user experience
        console.error("Failed to log activity:", err);
    }
}

// --- Profile & Encryption Management ---

export async function ensureUserProfile() {
    const supabase = await createClient(); // Auth Verification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
        console.error("ensureUserProfile: No authenticated user found.");
        return;
    }

    const adminSupabase = createAdminClient(); // Bypass RLS for Profile Sync

    try {
        // 1. Check if profile exists
        const { data: profile, error: fetchError } = await adminSupabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user.id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "Row not found" error
            console.error("ensureUserProfile fetch error:", fetchError);
        }

        // 2. Prepare Data from Auth Metadata
        const metaName = user.user_metadata.full_name || user.email?.split('@')[0] || 'Unknown';
        const metaEmail = user.email || '';
        const metaAvatar = user.user_metadata.avatar_url || '';

        // 3. Encrypt Data
        // console.log(`[Encryption] Encrypting for ${user.id} (${metaEmail})`);

        const encryptedEmail = metaEmail ? encrypt(metaEmail) : null;
        const encryptedName = encrypt(metaName);

        if (!profile) {
            console.log(`[Profile] Creating new encrypted profile for ${user.id}`);
            // INSERT
            const { error: insertError } = await adminSupabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: encryptedEmail, // Encrypted
                    full_name: encryptedName, // Encrypted
                    username: metaEmail.split('@')[0],
                    avatar_url: metaAvatar,
                    role: 'User'
                });

            if (insertError) console.error("Failed to create profile:", insertError);

        } else {
            // UPDATE / MIGRATION
            // Force update to ensure encryption is applied
            const { error: updateError } = await adminSupabase
                .from('profiles')
                .update({
                    email: encryptedEmail,
                    full_name: encryptedName,
                    // Synching avatar too if needed, but let's stick to encryption targets
                })
                .eq('id', user.id);

            if (updateError) {
                console.error("Failed to update/encrypt profile:", updateError);
            } else {
                // console.log("[Profile] Successfully encrypted profile data.");
            }
        }

    } catch (error) {
        console.error("ensureUserProfile Error:", error);
    }
}

// --- Image Management ---

export async function deleteImage(imageId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) return { success: false, error: "Unauthorized" };

    // 1. Fetch Image to get Storage URL (and verify ownership)
    const { data: image, error: fetchError } = await supabase
        .from('images')
        .select('*')
        .eq('id', imageId)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !image) return { success: false, error: "Image not found or access denied" };

    try {
        // 2. Delete from Storage (Best Effort)
        // Extract path from Public URL: .../generated_images/USER_ID/FILENAME.png
        const storageUrl = image.storage_url;
        if (storageUrl && storageUrl.includes("generated_images/")) {
            const path = storageUrl.split("generated_images/")[1];
            if (path) {
                // Decode URI component just in case
                const decodedPath = decodeURIComponent(path);
                const { error: storageError } = await supabase.storage
                    .from('generated_images')
                    .remove([decodedPath]);

                if (storageError) console.error("Storage delete error:", storageError);
            }
        }
    } catch (storageErr) {
        console.error("Storage delete failed (non-critical):", storageErr);
    }

    // 3. Delete from Database
    const { error: deleteError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', user.id);

    if (deleteError) return { success: false, error: deleteError.message };

    return { success: true };
}
