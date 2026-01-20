import { useState, useEffect, useCallback, useRef } from 'react';

export function useEmails() {
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Track recently marked as read
  const recentlyRead = useRef(new Set());

  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/get-emails');
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      
      // Filter out recently read emails
      const filteredEmails = (data.emails || []).filter(
        email => !recentlyRead.current.has(email.id)
      );
      
      setEmails(filteredEmails);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError(err.message);
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (email) => {
    try {
      // Optimistically remove from UI
      recentlyRead.current.add(email.id);
      setEmails(prev => prev.filter(e => e.id !== email.id));
      
      // Call Zapier webhook to mark as read and delete row
      const response = await fetch('/.netlify/functions/mark-email-reviewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          threadId: email.threadId, 
          messageId: email.id,
          rowIndex: email.rowIndex 
        }),
      });
      
      if (!response.ok) {
        recentlyRead.current.delete(email.id);
        await fetchEmails();
        throw new Error('Failed to mark email as reviewed');
      }
      
      // Keep in recentlyRead for 2 minutes
      setTimeout(() => {
        recentlyRead.current.delete(email.id);
      }, 2 * 60 * 1000);
      
      return true;
    } catch (err) {
      console.error('Error marking email as reviewed:', err);
      setError(err.message);
      return false;
    }
  }, [fetchEmails]);

  const draftReply = useCallback(async (email, instructions = '') => {
    try {
      const response = await fetch('/.netlify/functions/create-email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: email.from,
          subject: email.subject,
          summary: email.summary,
          instructions: instructions,
          threadId: email.threadId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create draft');
      
      return true;
    } catch (err) {
      console.error('Error creating draft:', err);
      setError(err.message);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (emailList) => {
    try {
      // Optimistically remove all from UI
      emailList.forEach(email => recentlyRead.current.add(email.id));
      setEmails([]);
      
      // Call API for each email (in parallel)
      const promises = emailList.map(email => 
        fetch('/.netlify/functions/mark-email-reviewed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            threadId: email.threadId, 
            messageId: email.id,
            rowIndex: email.rowIndex 
          }),
        })
      );
      
      await Promise.all(promises);
      
      // Keep in recentlyRead for 2 minutes
      setTimeout(() => {
        emailList.forEach(email => recentlyRead.current.delete(email.id));
      }, 2 * 60 * 1000);
      
      return true;
    } catch (err) {
      console.error('Error marking all as reviewed:', err);
      setError(err.message);
      await fetchEmails();
      return false;
    }
  }, [fetchEmails]);

  // Fetch on mount
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchEmails, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  return {
    emails,
    isLoading,
    error,
    refetch: fetchEmails,
    markAsRead,
    markAllAsRead,
    draftReply,
  };
}
