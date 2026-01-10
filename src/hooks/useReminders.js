import { useState, useEffect, useCallback } from 'react';

// Make.com webhook URL for adding reminders
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/p7car46fq166skwohb2qluvxlxg6wz9a';

export function useReminders() {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reminders from Google Sheets
  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/get-reminders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      
      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a new reminder via Make.com webhook (instant!)
  const addReminder = useCallback(async (task, dueDate = '', list = 'Family Reminders') => {
    try {
      // Call Make.com webhook directly
      const params = new URLSearchParams({
        task: task,
        dueDate: dueDate,
        list: list,
      });
      
      const response = await fetch(`${MAKE_WEBHOOK_URL}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors', // Webhook doesn't return CORS headers
      });
      
      // With no-cors, we can't read the response, but the request goes through
      // Refresh the list after a short delay to allow sync
      setTimeout(() => {
        fetchReminders();
      }, 3000);
      
      return { success: true };
    } catch (err) {
      console.error('Error adding reminder:', err);
      return { success: false, error: err.message };
    }
  }, [fetchReminders]);

  // Complete a reminder
  const completeReminder = useCallback(async (reminder) => {
    try {
      const response = await fetch('/.netlify/functions/complete-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rowNumber: reminder.rowNumber,
          task: reminder.task 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete reminder');
      }
      
      // Remove from local state immediately for better UX
      setReminders(prev => prev.filter(r => r.rowNumber !== reminder.rowNumber));
      
      return { success: true };
    } catch (err) {
      console.error('Error completing reminder:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Fetch reminders on mount and every 30 seconds
  useEffect(() => {
    fetchReminders();
    
    const interval = setInterval(fetchReminders, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [fetchReminders]);

  return {
    reminders,
    isLoading,
    error,
    fetchReminders,
    addReminder,
    completeReminder,
  };
}
