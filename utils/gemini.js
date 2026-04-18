const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

exports.analyzeRequest = async (description) => {
    try {
        const prompt = `Analyze this help request description: "${description}". 
        Return a JSON object with: 
        1. "category" (one of: Programming, Design, Marketing, Academics, Other)
        2. "tags" (array of 3 relevant skill tags)
        3. "summary" (one sentence summary for helper list)
        Only return the JSON.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Extract JSON from response (sometimes Gemini adds markdown ticks)
        const jsonStr = text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini Error:", error);
        return { category: "Other", tags: ["Help"], summary: "Help request posted." };
    }
};

exports.suggestSkillsForOnboarding = async (interests) => {
    try {
        const prompt = `Based on these interests: "${interests.join(', ')}", suggest:
        1. A list of 5 professional skills the user can offer to help others.
        2. A list of 5 areas the user might need help in to grow.
        Return as JSON: {"canHelp": [...], "needHelp": [...]}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Gemini Error:", error);
        return { canHelp: ["General Help"], needHelp: ["Mentorship"] };
    }
};
