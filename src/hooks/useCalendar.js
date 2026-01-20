import { useState, useEffect, useCallback } from 'react';

export function useCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Format date for API calls - use local timezone, not UTC
  const formatDateParam = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch all calendar events (work calendar contains both work + family)
  const fetchEvents = useCallback(async (date) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const dateParam = formatDateParam(date);
      const response = await fetch(`/.netlify/functions/get-work-calendar?date=${dateParam}`);
      if (!response.ok) throw new Error('Failed to fetch calendar');
      const data = await response.json();
      setAllEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      setAllEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change selected date
  const goToDate = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const goToPrevDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  }, [selectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Separate events by calendar type
  const workEvents = allEvents.filter(e => e.calendar === 'work');
  const familyEvents = allEvents.filter(e => e.calendar === 'family');

  // Fetch when selected date changes
  useEffect(() => {
    fetchEvents(selectedDate);
  }, [selectedDate, fetchEvents]);

  // Also refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(selectedDate);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedDate, fetchEvents]);

  return {
    selectedDate,
    workEvents,
    familyEvents,
    allEvents,
    isLoading,
    error,
    goToDate,
    goToPrevDay,
    goToNextDay,
    goToToday,
    refetch: () => fetchEvents(selectedDate),
  };
}
