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
    const dateParam = params.date; // Expected format: YYYY-MM-DD
    
    // Parse the date in local context (Chicago time)
    // The dateParam comes as YYYY-MM-DD representing the user's local date
    let targetYear, targetMonth, targetDay;
    
    if (dateParam) {
      const parts = dateParam.split('-');
      targetYear = parseInt(parts[0]);
      targetMonth = parseInt(parts[1]) - 1; // JS months are 0-indexed
      targetDay = parseInt(parts[2]);
    } else {
      // Default to today in Chicago (UTC-6)
      const chicagoOffset = -6 * 60; // minutes
      const now = new Date();
      const chicagoTime = new Date(now.getTime() + (chicagoOffset - now.getTimezoneOffset()) * 60000);
      targetYear = chicagoTime.getFullYear();
      targetMonth = chicagoTime.getMonth();
      targetDay = chicagoTime.getDate();
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
    
    // Parse with ical.js - pass year, month, day separately to avoid timezone issues
    const events = parseICalWithLibrary(icalData, targetYear, targetMonth, targetDay);

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

function parseICalWithLibrary(icalData, targetYear, targetMonth, targetDay) {
  const events = [];
  
  try {
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    // Target date string for comparison
    const targetDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
    
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
          
          // Get the date part of this occurrence
          const occYear = next.year;
          const occMonth = next.month; // ICAL.js months are 1-indexed
          const occDay = next.day;
          const occDateStr = `${occYear}-${String(occMonth).padStart(2, '0')}-${String(occDay).padStart(2, '0')}`;
          
          // Stop if we're past the target day
          if (occDateStr > targetDateStr) break;
          
          // Check if this occurrence falls on target day
          if (occDateStr === targetDateStr) {
            const duration = event.duration;
            
            // Build ISO string using the ICAL time components directly (preserves local time)
            const startHour = String(next.hour).padStart(2, '0');
            const startMin = String(next.minute).padStart(2, '0');
            const startISO = `${occDateStr}T${startHour}:${startMin}:00`;
            
            // Calculate end time
            const durationMs = duration.toSeconds() * 1000;
            const startDate = new Date(startISO);
            const endDate = new Date(startDate.getTime() + durationMs);
            const endISO = endDate.toISOString();
            
            events.push({
              id: event.uid + '_' + next.toString(),
              title: event.summary || 'No Title',
              start: startISO,
              end: endISO,
              location: event.location || '',
              description: event.description || '',
              allDay: event.startDate.isDate,
              calendar: 'family',
            });
          }
        }
      } else {
        // Non-recurring event - compare date parts
        const startDate = event.startDate;
        const eventDateStr = `${startDate.year}-${String(startDate.month).padStart(2, '0')}-${String(startDate.day).padStart(2, '0')}`;
        
        if (eventDateStr === targetDateStr) {
          // Build ISO string using ICAL time components directly
          const startHour = String(startDate.hour).padStart(2, '0');
          const startMin = String(startDate.minute).padStart(2, '0');
          const startISO = `${eventDateStr}T${startHour}:${startMin}:00`;
          
          let endISO = startISO;
          if (event.endDate) {
            const endHour = String(event.endDate.hour).padStart(2, '0');
            const endMin = String(event.endDate.minute).padStart(2, '0');
            const endDateStr = `${event.endDate.year}-${String(event.endDate.month).padStart(2, '0')}-${String(event.endDate.day).padStart(2, '0')}`;
            endISO = `${endDateStr}T${endHour}:${endMin}:00`;
          }
          
          events.push({
            id: event.uid,
            title: event.summary || 'No Title',
            start: startISO,
            end: endISO,
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
