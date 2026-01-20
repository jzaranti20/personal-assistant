// Netlify function to draft an email reply using Claude

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { from, subject, summary, instructions } = JSON.parse(event.body || '{}');

    if (!subject || !summary) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email details are required' }),
      };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Extract sender's first name from email
    const senderName = from.split('<')[0].trim().split(' ')[0] || 'there';

    // Build the prompt with optional instructions
    let prompt = `Draft a professional but friendly email reply for John Zaranti (who works at Medix).

Original email from: ${from}
Subject: ${subject}
Summary of email: ${summary}
`;

    if (instructions && instructions.trim()) {
      prompt += `
John's instructions for this reply: ${instructions}
`;
    }

    prompt += `
Write a concise, helpful reply that:
- Addresses the sender by first name
- Responds to their main points/requests
${instructions ? '- Incorporates John\'s specific instructions above' : ''}
- Is professional but warm
- Ends with an appropriate sign-off
- Is ready to send (no placeholders like [insert here])

Just provide the email body text, no subject line needed. Keep it brief - 2-4 short paragraphs max.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to generate reply' }),
      };
    }

    const data = await response.json();
    const draft = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ draft }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
