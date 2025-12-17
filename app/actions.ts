'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

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

// --- Types ---
interface GenerationResult {
    success: boolean;
    imageUrl?: string | null;
    analysis?: string;
    modelUsed?: string;
    errorLogs?: string[];
    error?: string;
}

export async function generateImage(formData: FormData): Promise<GenerationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY is missing.");
        return { success: false, error: "Server configuration error: API Key missing.", errorLogs: [] };
    }

    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File | null;
    const aspectRatio = formData.get('aspectRatio') as string || "1:1";
    const errorLogs: string[] = [];

    if (!prompt) return { success: false, error: 'Prompt is required', errorLogs: [] };

    let faceDescription = "";
    let finalPrompt = prompt;

    try {
        // --- Step 1: Vision Analysis (If image provided) ---
        if (imageFile) {
            try {
                console.log(`[Phase 1] Analyzing Face with ${VISION_MODEL}...`);
                const arrayBuffer = await imageFile.arrayBuffer();
                const imageBase64 = Buffer.from(arrayBuffer).toString('base64');

                const genAI = new GoogleGenerativeAI(apiKey);
                const visionModel = genAI.getGenerativeModel({ model: VISION_MODEL });

                const analysisPrompt = "Describe the person in this image. Focus closely on physical features: eye color, hair style/color, facial structure, skin tone, age, and ethnicity. Be concise. Do not describe clothing or background.";

                const visionResult = await visionModel.generateContent([
                    analysisPrompt,
                    { inlineData: { data: imageBase64, mimeType: imageFile.type } }
                ]);

                faceDescription = visionResult.response.text();
                // Combine User Prompt + Face Description
                finalPrompt = `High quality, photorealistic image. ${prompt}. \n\nSubject Reference: ${faceDescription}`;
                console.log("Vision Description:", faceDescription);

            } catch (visionError: any) {
                console.warn(`Vision analysis failed: ${visionError.message}`);
                errorLogs.push(`Vision Analysis Failed: ${visionError.message}`);
            }
        } else {
            finalPrompt = `High quality, photorealistic image of ${prompt}`;
        }

        // --- Step 2: Image Generation (Imagen 4.0 via REST) ---
        try {
            console.log(`[Phase 2] Generating with ${PRIMARY_MODEL} (Ratio: ${aspectRatio})...`);

            const payload = {
                instances: [
                    { prompt: finalPrompt }
                ],
                parameters: {
                    sampleCount: 1,
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
                console.error(`Imagen API Error (${response.status}):`, errorText);
                throw new Error(`Google API Error ${response.status}: ${errorText || response.statusText}`);
            }

            const data = await response.json();

            if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {
                const base64Image = data.predictions[0].bytesBase64Encoded;
                let publicUrl = `data:image/png;base64,${base64Image}`; // Default fallback
                let saveError = null;

                // --- Step 3: Supabase Storage & Persistence ---
                try {
                    const supabase = await createClient();
                    const { data: { user }, error: authError } = await supabase.auth.getUser();

                    if (user && !authError) {
                        console.log(`[Phase 3] Uploading to Supabase Storage for user ${user.id}...`);

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
                            const { error: dbError } = await supabase
                                .from('images')
                                .insert({
                                    user_id: user.id,
                                    prompt: prompt, // Original user prompt
                                    model: PRIMARY_MODEL,
                                    storage_path: fileName,
                                    storage_url: storageUrl,
                                    face_description: faceDescription, // Analysis result
                                    final_prompt: finalPrompt // The actual full prompt sent to Imagen
                                });

                            if (dbError) {
                                console.error("DB Insert Error:", dbError);
                                saveError = "Image saved to storage but failed to record in DB.";
                            } else {
                                console.log("Successfully saved image to DB and Storage!");
                            }
                        }
                    } else {
                        console.log("User not logged in. Skipping storage.");
                        // Optional: Add log if we want to force login
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
                    analysis: `[Used ${PRIMARY_MODEL}]\n\n**Included Face Description:**\n${faceDescription || "(No image reference used)"}\n\n**Final Prompt:**\n${finalPrompt}`,
                    modelUsed: PRIMARY_MODEL,
                    errorLogs: saveError ? [...errorLogs, saveError] : errorLogs
                };
            } else {
                console.error("Gemini/Imagen API Raw Response:", JSON.stringify(data, null, 2));
                // Try to extract a meaningful error message if possible
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
