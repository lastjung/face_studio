const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API KEY found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const list = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).apiKey; // Hack to get client
        // Actually SDK has listModels method on the client/manager usually?
        // Checking SDK docs pattern: usually fetch 'models' endpoint.
        // The node SDK might not expose listModels directly on the main class easily in v0.x
        // Let's use the standard fetch to be sure.

        // Actually, the SDK does NOT expose listModels easily in the main entry.
        // I will use direct REST call which is reliable.

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("Error listing models:", data.error);
            return;
        }

        console.log("Available Models:");
        (data.models || []).forEach(m => {
            console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
        });

    } catch (error) {
        console.error("Failed to list models:", error);
    }
}

listModels();
