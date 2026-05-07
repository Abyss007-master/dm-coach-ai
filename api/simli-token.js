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
    const SIMLI_API_KEY = process.env.SIMLI_API_KEY;
    const FACE_ID = '3c90c3cc-0d44-4b50-8888-8dd25736052a'; // Default Simli face

    if (!SIMLI_API_KEY) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    // Call Simli compose token endpoint
    const tokenRes = await fetch('https://api.simli.ai/compose/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-simli-api-key': SIMLI_API_KEY
      },
      body: JSON.stringify({
        faceId: FACE_ID,
        handleSilence: true,
        maxSessionLength: 600,
        maxIdleTime: 180,
        model: 'fasttalk'
      })
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ error: data.error || data.message || 'Simli token error' });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Simli token error:', error.message);
    return res.status(500).json({ error: 'Failed to generate Simli session token: ' + error.message });
  }
}
