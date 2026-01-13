// Netlify function to send email draft request to Zapier webhook

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
    const { from, subject, summary, instructions, threadId } = JSON.parse(event.body || '{}');

    if (!subject || !instructions) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subject and instructions are required' }),
      };
    }

    // Zapier webhook URL for creating Gmail drafts
    const webhookUrl = process.env.ZAPIER_EMAIL_DRAFT_WEBHOOK || 'https://hooks.zapier.com/hooks/catch/18331363/ughf7fz/';

    // Extract email address from "Name <email>" format
    const toMatch = from.match(/<([^>]+)>/);
    const toEmail = toMatch ? toMatch[1] : from;

    // Send to Zapier webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toEmail,
        subject: `Re: ${subject}`,
        originalFrom: from,
        originalSubject: subject,
        summary: summary,
        instructions: instructions,
        threadId: threadId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Zapier webhook error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to create draft' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
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
