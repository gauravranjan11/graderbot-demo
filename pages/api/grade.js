const { Configuration, OpenAIApi } = require('openai')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

function buildPrompt(website) {
  return `You are an AI assistant grading restaurant websites focused on Indian and Goan restaurants.
Analyze the website content at this URL: ${website}.
Grade it from A+ to F on mobile-friendliness, menu clarity, SEO basics, and user experience.
Provide a short summary and 3 actionable suggestions for improvement.`
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { website, email } = req.body

  if (!website || !email) {
    return res.status(400).json({ error: 'Missing website or email' })
  }

  try {
    const prompt = buildPrompt(website)

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    })

    const content = completion.data.choices[0].message?.content || ''
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean)

    let grade = 'N/A'
    let summary = ''
    let suggestions = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^Grade:/i.test(line)) {
        grade = line.replace(/^Grade:/i, '').trim()
      } else if (/^Summary:/i.test(line)) {
        summary = line.replace(/^Summary:/i, '').trim()
      } else if (/^Suggestions?:/i.test(line)) {
        suggestions = lines.slice(i + 1).map(l => l.replace(/^[0-9]+\.\s*/, '').trim())
        break
      }
    }

    return res.status(200).json({ grade, summary, suggestions })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Failed to generate grade' })
  }
}

