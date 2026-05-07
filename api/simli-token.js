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

    if (!SIMLI_API_KEY) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    // Use Simli's well-known default face (tmp9i8bbq7c)
    // or override with env variable SIMLI_FACE_ID
    const FACE_ID = process.env.SIMLI_FACE_ID || 'tmp9i8bbq7c';

    const tokenRes = await fetch('https://api.simli.ai/compose/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-simli-api-key': SIMLI_API_KEY
      },
      body: JSON.stringify({
        faceId: FACE_ID,
        apiVersion: 'v2',
        sessionAggregator: null,
        handleSilence: true,
        maxSessionLength: 600,
        maxIdleTime: 180,
        startFrame: 0,
        audioInputFormat: 'pcm16'
      })
    });

    const responseText = await tokenRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Simli raw response:', responseText);
      return res.status(500).json({ error: 'Invalid JSON from Simli: ' + responseText.substring(0, 200) });
    }

    if (!tokenRes.ok) {
      console.error('Simli error response:', data);
      return res.status(tokenRes.status).json({
        error: data.detail || data.error || data.message || 'Simli token API error',
        raw: data
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Simli token handler error:', error.message);
    return res.status(500).json({ error: 'Failed to generate token: ' + error.message });
  }
}
