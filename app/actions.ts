'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';

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
    const errorLogs: string[] = [];

    if (!prompt) return { success: false, error: 'Prompt is required', errorLogs: [] };

    try {
        // --- Step 1: Vision Analysis (If image provided) ---
        let faceDescription = "";
        let finalPrompt = prompt;

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
            console.log(`[Phase 2] Generating with ${PRIMARY_MODEL}...`);

            const payload = {
                instances: [
                    { prompt: finalPrompt }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
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
                throw new Error(`REST API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {
                return {
                    success: true,
                    imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`,
                    // Show transparency: What the user asked + What the Vision AI added
                    analysis: `[Used ${PRIMARY_MODEL}]\n\n**Included Face Description:**\n${faceDescription || "(No image reference used)"}`,
                    modelUsed: PRIMARY_MODEL,
                    errorLogs
                };
            } else {
                throw new Error("No image data found in REST response.");
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
