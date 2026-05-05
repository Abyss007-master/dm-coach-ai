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

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemPrompt = `You are an expert Digital Marketing Coach with 10+ years of experience. You specialize in SEO, SEM, Google Ads, Meta Ads, Content Marketing, Social Media Marketing, Email Marketing, Analytics, and Personal Branding. Your job is to give clear, actionable, practical advice to students and professionals who want to grow in digital marketing. Always be encouraging, structured, and give real-world examples. Keep answers concise but complete. If someone asks about topics unrelated to digital marketing, politely redirect them back to digital marketing topics.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt + '\n\nUser question: ' + message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
