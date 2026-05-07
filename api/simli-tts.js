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
    if (typeof body === 'string') { body = JSON.parse(body); }

    const { text } = body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const SIMLI_API_KEY = process.env.SIMLI_API_KEY;

    if (!SIMLI_API_KEY) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    // Use ElevenLabs via Simli's TTS endpoint to generate PCM audio
    // Simli expects PCM16 audio at 16KHz mono
    // We'll use the Web Speech API fallback or Simli's built-in TTS

    // Call Simli's audio-to-video REST endpoint for static generation
    // For real-time: audio is sent directly through WebRTC data channel
    // This endpoint generates PCM audio from text using a default TTS

    const ttsRes = await fetch('https://api.simli.ai/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-simli-api-key': SIMLI_API_KEY
      },
      body: JSON.stringify({
        text: text,
        voice: 'en-US-Neural2-J'
      })
    });

    if (!ttsRes.ok) {
      // Fallback: return empty PCM buffer (silence) - avatar still shows
      const silenceBuffer = Buffer.alloc(3200); // 100ms of silence at 16KHz
      res.setHeader('Content-Type', 'audio/pcm');
      return res.status(200).send(silenceBuffer);
    }

    const audioBuffer = await ttsRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/pcm');
    return res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error('Simli TTS error:', error.message);
    // Return silence on error - avatar stays alive
    const silenceBuffer = Buffer.alloc(3200);
    res.setHeader('Content-Type', 'audio/pcm');
    return res.status(200).send(silenceBuffer);
  }
}
