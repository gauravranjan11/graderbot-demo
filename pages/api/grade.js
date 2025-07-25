// pages/api/grade.js

// 1. Import the Gemini SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Choose your Gemini model (e.g., 'gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro')
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });


function buildPrompt(website) {
  // Your prompt remains similar, as it's just text for the model
  return `Grade the following website: ${website}. Provide a grade (A, B, C, D, F), a brief summary of its strengths and weaknesses, and 3 actionable suggestions for improvement.`;
}

module.exports = async function handler(req, res) {
  // CORS Preflight Handling (if needed, or rely on vercel.json)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { website, email } = req.body;

  if (!website || !email) {
    return res.status(400).json({ error: 'Website URL and email are required.' });
  }

  // Basic URL validation
  try {
    new URL(website);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid website URL format.' });
  }

  try {
    const prompt = buildPrompt(website);

    // 3. Make the Gemini API call
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const gradeResponse = response.text(); // Get the generated text

    // 4. Parse the response (similar to your OpenAI parsing)
    const lines = gradeResponse.split('\n').filter(line => line.trim() !== '');
    const grade = lines[0] || 'N/A';
    const summaryIndex = lines.findIndex(line => line.toLowerCase().includes('summary'));
    const suggestionsIndex = lines.findIndex(line => line.toLowerCase().includes('suggestions'));

    let summary = 'No summary provided.';
    let suggestions = ['No suggestions provided.'];

    if (summaryIndex !== -1 && suggestionsIndex !== -1 && summaryIndex < suggestionsIndex) {
      summary = lines.slice(summaryIndex + 1, suggestionsIndex).join('\n').trim();
      suggestions = lines.slice(suggestionsIndex + 1).filter(line => line.startsWith('-')).map(line => line.substring(1).trim());
    } else if (summaryIndex !== -1) {
      summary = lines.slice(summaryIndex + 1).join('\n').trim();
    }


    res.status(200).json({
      grade,
      summary,
      suggestions,
      email,
      website,
      rawResponse: gradeResponse // Useful for debugging
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    // You can check error.response.status for specific HTTP codes
    res.status(500).json({ error: 'Failed to process request with Gemini.' });
  }
};
