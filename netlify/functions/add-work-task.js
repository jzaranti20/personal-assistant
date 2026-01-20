// Netlify function to add a work task via Zapier webhook

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
    const { task, dueDate, notes } = JSON.parse(event.body || '{}');

    if (!task) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Task title is required' }),
      };
    }

    // Zapier webhook URL for creating Google Tasks
    const webhookUrl = process.env.ZAPIER_WORK_TASK_WEBHOOK || 'https://hooks.zapier.com/hooks/catch/18331363/ug4qwza/';

    // Call the Zapier webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        task,
        dueDate: dueDate || '',
        notes: notes || '',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Zapier webhook error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to add work task' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        task: { title: task, dueDate, notes },
      }),
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
