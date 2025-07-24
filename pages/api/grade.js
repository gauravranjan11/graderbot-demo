export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { website, email } = req.body;

  if (!website || !email) {
    return res.status(400).json({ error: 'Missing website or email' });
  }

  try {
    const prompt = `You are an AI assistant grading restaurant websites focused on Indian and Goan restaurants.
    Analyze the website content at this URL: ${website}.
    Grade it from A+ to F on mobile-friendliness, menu clarity, SEO basics, and user experience.
    Provide a short summary and 3 actionable suggestions for improvement.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    let grade = "N/A", summary = "", suggestions = [];

    for (let line of lines) {
      if (line.match(/^Grade:/i)) {
        grade = line.replace(/^Grade:/i, '').trim();
      } else if (line.match(/^Summary:/i)) {
        summary = line.replace(/^Summary:/i, '').trim();
      } else if (line.match(/^Suggestions?:/i)) {
        const idx = lines.indexOf(line);
        suggestions = lines.slice(idx + 1).map(l => l.replace(/^\d+\.\s*/, '').trim());
        break;
      }
    }

    res.status(200).json({ grade, summary, suggestions });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: 'Failed to generate grade' });
  }
}
