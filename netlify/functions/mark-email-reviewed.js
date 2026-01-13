// Netlify function to send reviewed email to Zapier webhook
// Zapier will mark as read in Gmail and delete the row in Google Sheets

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
    const { threadId, messageId, rowIndex } = JSON.parse(event.body || '{}');

    if (!threadId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Thread ID is required' }),
      };
    }

    // Zapier webhook URL for marking email as reviewed
    const webhookUrl = process.env.ZAPIER_EMAIL_REVIEWED_WEBHOOK || 'https://hooks.zapier.com/hooks/catch/18331363/ugmcfwv/';

    // Send to Zapier webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: threadId,
        messageId: messageId,
        rowIndex: rowIndex,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Zapier webhook error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to mark email as reviewed' }),
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
