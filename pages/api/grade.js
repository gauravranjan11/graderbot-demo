import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

function buildPrompt(website: string): string {
  return `You are an AI assistant grading restaurant websites focused on Indian and Goan restaurants.
  Analyze the website content at this URL: ${website}.
  Grade it from A+ to F on mobile-friendliness, menu clarity, SEO basics, and user experience.
  Provide a short summary and 3 actionable suggestions for improvement.`
}

export default async function handler(req, res) {
  // Allow CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

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

    const content = completion.data.choices[0].message.content

    const lines = content.split('\n').map(line => line.trim()).filter(Boolean)
    let grade = 'N/A'
    let summary = ''
    let suggestions = []

    for (let line of lines) {
      if (line.match(/^Grade:/i)) {
        grade = line.replace(/^Grade:/i, '').trim()
      } else if (line.match(/^Summary:/i)) {
        summary = line.replace(/^Summary:/i, '').trim()
      } else if (line.match(/^Suggestions?:/i)) {
        const idx = lines.indexOf(line)
        suggestions = lines.slice(idx + 1).map(l => l.replace(/^[0-9]+\.\s*/, '').trim())
        break
      }
    }

    res.status(200).json({ grade, summary, suggestions })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to generate grade' })
  }
}

