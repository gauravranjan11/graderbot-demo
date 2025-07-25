// pages/api/grade.js (after moving to the correct directory)

// 1. Correct import for OpenAI v4
const OpenAI = require('openai'); // Notice the Capital 'O' and no 'Configuration' or 'OpenAIApi'

// 2. Initialize the client directly
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set in Vercel
});

// Your existing buildPrompt function (assuming it's correct)
function buildPrompt(website) {
  return `Grade the following website: ${website}. Provide a grade (A, B, C, D, F), a brief summary of its strengths and weaknesses, and 3 actionable suggestions for improvement.`;
}

// Your API route handler
module.exports = async function handler(req, res) {
  // CORS Preflight Handling (if needed, otherwise rely on vercel.json)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or your specific frontend domain
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

    // 3. Correct API call for OpenAI v4 (chat completions)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or 'gpt-3.5-turbo', 'gpt-4', etc.
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500, // Limit the response length
    });

    // 4. Correct way to access content in OpenAI v4
    const gradeResponse = completion.choices[0].message?.content || 'No content generated.';

    // Assuming you want to parse the response into structured data
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
    console.error('OpenAI API Error:', error);
    // You might want to differentiate between API errors and other errors
    res.status(500).json({ error: 'Failed to process request due to an internal server error.' });
  }
};
