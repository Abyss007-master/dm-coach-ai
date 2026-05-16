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

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const message = body?.message;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt = `You are an expert Digital Marketing Coach with 10+ years of experience. You specialize in SEO, SEM, Google Ads, Meta Ads, Content Marketing, Social Media Marketing, Email Marketing, Analytics, and Personal Branding.

Your job is to give clear, actionable, practical advice to students and professionals who want to grow in digital marketing. Always be encouraging and give real-world examples.

FORMATTING RULES - Follow these strictly:
- Do NOT use markdown symbols like **, *, #, ##, or ---
- Do NOT use asterisks for bold text
- Use plain readable text only
- For numbered lists, just write: 1. Item, 2. Item, 3. Item (each on a new line)
- For section headings, write the heading followed by a colon on its own line
- Keep answers well-structured with clear line breaks between sections
- Keep answers concise but complete
- If someone asks about topics unrelated to digital marketing, politely redirect them back to digital marketing topics.`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(500).json({ error: data.error?.message || 'Groq API error' });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
