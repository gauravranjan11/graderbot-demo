import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing website URL' });
  }

  try {
    const prompt = `You are a restaurant marketing expert. Analyze the following restaurant website for its design, SEO presence, mobile responsiveness, and clarity of offering. Provide a detailed report in bullet points:\n\nURL: ${url}\n\nOutput:`;

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const report = chat.choices[0].message.content;
    return res.status(200).json({ report });
  } catch (err: any) {
    console.error('API error:', err.message);
    return res.status(500).json({ error: 'Something went wrong generating the report.' });
  }
}

