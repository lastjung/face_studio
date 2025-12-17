const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testGenerate() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-image" });
        const prompt = "A cute robot holding a flower, 3d render";

        console.log("Generating...");
        const result = await model.generateContent([prompt]);

        console.log("Response Candidates Length:", result.response.candidates.length);
        // Log the structure of the first part
        const firstPart = result.response.candidates[0].content.parts[0];
        console.log("First Part Keys:", Object.keys(firstPart));

        if (firstPart.inlineData) {
            console.log("Found inlineData! MimeType:", firstPart.inlineData.mimeType);
            console.log("Data Length:", firstPart.inlineData.data.length);
        } else {
            console.log("No inlineData found. Full Part:", JSON.stringify(firstPart, null, 2));
        }

    } catch (error) {
        console.error("Generation failed:", error);
    }
}

testGenerate();
