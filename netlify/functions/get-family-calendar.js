// Netlify function to fetch events from iCloud Calendar (Family)
// With caching and proper ICS parsing including recurring events

import ICAL from 'ical.js';

// Simple in-memory cache
let cachedData = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // iCloud calendar URL
    const icalUrl = process.env.ICLOUD_FAMILY_CALENDAR_URL || 
      'https://p108-caldav.icloud.com/published/2/NDE4NTIwMzIzNDE4NTIwM1Iy6-N1HK3LvmQxpVFq3T2aLqGUsCGinq_RRl8WckQCovMt3_NhudQEWeAxcIp4xC2Twv3hPckvK13qP6O45Z4';
    
    // Get date from query params or use today
    const params = event.queryStringParameters || {};
    const dateParam = params.date;
    
    let targetDate;
    if (dateParam) {
      targetDate = new Date(dateParam + 'T00:00:00');
    } else {
      targetDate = new Date();
    }
    
    // Check cache
    const now = Date.now();
    let icalData;
    
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      icalData = cachedData;
    } else {
      const response = await fetch(icalUrl);
      
      if (!response.ok) {
        console.error('iCal fetch error:', response.status);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch family calendar' }),
        };
      }

      icalData = await response.text();
      cachedData = icalData;
      cacheTimestamp = now;
    }
    
    // Parse with ical.js
    const events = parseICalWithLibrary(icalData, targetDate);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ events }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}

function parseICalWithLibrary(icalData, targetDate) {
  const events = [];
  
  try {
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    // Get start and end of target day
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1);
    
    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent);
      
      // Check if this is a recurring event
      if (event.isRecurring()) {
        const iterator = event.iterator();
        let next;
        let count = 0;
        const maxIterations = 1000;
        
        while ((next = iterator.next()) && count < maxIterations) {
          count++;
          
          const occurrenceStart = next.toJSDate();
          
          if (occurrenceStart >= endOfDay) break;
          
          if (occurrenceStart >= startOfDay && occurrenceStart < endOfDay) {
            const duration = event.duration;
            const occurrenceEnd = new Date(occurrenceStart.getTime() + (duration.toSeconds() * 1000));
            
            events.push({
              id: event.uid + '_' + next.toString(),
              title: event.summary || 'No Title',
              start: occurrenceStart.toISOString(),
              end: occurrenceEnd.toISOString(),
              location: event.location || '',
              description: event.description || '',
              allDay: event.startDate.isDate,
              calendar: 'family',
            });
          }
        }
      } else {
        const eventStart = event.startDate.toJSDate();
        const eventEnd = event.endDate ? event.endDate.toJSDate() : eventStart;
        
        if (eventStart >= startOfDay && eventStart < endOfDay) {
          events.push({
            id: event.uid,
            title: event.summary || 'No Title',
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            location: event.location || '',
            description: event.description || '',
            allDay: event.startDate.isDate,
            calendar: 'family',
          });
        }
      }
    }
  } catch (parseError) {
    console.error('ICS parse error:', parseError);
  }
  
  events.sort((a, b) => new Date(a.start) - new Date(b.start));
  
  return events;
}
