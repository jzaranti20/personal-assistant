// Netlify function to fetch events from Google Calendar via ICS feed
// Includes both work and family (subscribed) calendars

import ICAL from 'ical.js';

// Simple in-memory cache (resets on cold start, but helps with warm instances)
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
    // Google Calendar Secret ICS URL (contains both work + subscribed family calendar)
    const icalUrl = process.env.GOOGLE_WORK_CALENDAR_ICS || 
      'https://calendar.google.com/calendar/ical/jzaranti%40medixteam.com/private-c6d4cf8387d0ede3b464504019240d9d/basic.ics';
    
    // Get date from query params or use today
    const params = event.queryStringParameters || {};
    const dateParam = params.date; // Expected format: YYYY-MM-DD
    
    // Target date in Chicago timezone
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
          body: JSON.stringify({ error: 'Failed to fetch calendar', status: response.status }),
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
      
      // Determine if this is a family event
      // Check various properties that might indicate the calendar source
      const calendarName = vevent.getFirstPropertyValue('x-wr-calname') || '';
      const organizer = vevent.getFirstPropertyValue('organizer') || '';
      const summary = event.summary || '';
      const description = event.description || '';
      
      // Check if it's from the Family calendar
      const isFamily = 
        calendarName.toLowerCase().includes('family') ||
        organizer.toLowerCase().includes('icloud') ||
        // Check if UID contains icloud (iCloud events have distinctive UIDs)
        (event.uid && event.uid.toLowerCase().includes('icloud'));
      
      // Check if this is a recurring event
      if (event.isRecurring()) {
        // Expand recurring events for this day
        const iterator = event.iterator();
        let next;
        let count = 0;
        const maxIterations = 1000; // Safety limit
        
        while ((next = iterator.next()) && count < maxIterations) {
          count++;
          
          const occurrenceStart = next.toJSDate();
          
          // Stop if we're past the target day
          if (occurrenceStart >= endOfDay) break;
          
          // Check if this occurrence falls on target day
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
              calendar: isFamily ? 'family' : 'work',
            });
          }
        }
      } else {
        // Non-recurring event
        const eventStart = event.startDate.toJSDate();
        const eventEnd = event.endDate ? event.endDate.toJSDate() : eventStart;
        
        // Check if event falls on target day
        if (eventStart >= startOfDay && eventStart < endOfDay) {
          events.push({
            id: event.uid,
            title: event.summary || 'No Title',
            start: eventStart.toISOString(),
            end: eventEnd.toISOString(),
            location: event.location || '',
            description: event.description || '',
            allDay: event.startDate.isDate,
            calendar: isFamily ? 'family' : 'work',
          });
        }
      }
    }
  } catch (parseError) {
    console.error('ICS parse error:', parseError);
  }
  
  // Sort by start time
  events.sort((a, b) => new Date(a.start) - new Date(b.start));
  
  return events;
}
