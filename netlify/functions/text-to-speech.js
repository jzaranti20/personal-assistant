// Netlify serverless function to proxy requests to ElevenLabs API
// This keeps your API key secure on the server side

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { text } = JSON.parse(event.body);

    if (!text) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Text is required' }),
      };
    }

    // Get API key from environment variable
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in your Netlify environment variables.' 
        }),
      };
    }

    // You can change this voice ID to any ElevenLabs voice
    // Rachel (calm, natural female voice): 21m00Tcm4TlvDq8ikWAM
    // Adam (natural male voice): pNInz6obpgDQGcFmaJgB
    // Bella (warm female voice): EXAVITQu4vr4xnSDxMaL
    // Antoni (natural male voice): ErXwobaYiN019PkySvjV
    // Elli (young female voice): MF3mGyEYCl7XYWbV9V6O
    // Josh (young male voice): TxGEqnHWrfWFTfGW9XjX
    // Arnold (crisp male voice): VR6AewLTigWG4xSOukaG
    // Sam (raspy male voice): yoZ06aMxZJJ28mfd3POQ
    const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default to Rachel

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      
      return {
        statusCode: response.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `ElevenLabs API error: ${response.status}` 
        }),
      };
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'audio/mpeg',
      },
      body: Buffer.from(audioBuffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
    };
  }
}
