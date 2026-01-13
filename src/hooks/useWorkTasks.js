import { useState, useEffect, useCallback, useRef } from 'react';

export function useWorkTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Track recently completed tasks to filter them out (prevents race condition)
  const recentlyCompleted = useRef(new Set());

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/get-work-tasks');
      if (!response.ok) throw new Error('Failed to fetch work tasks');
      const data = await response.json();
      
      // Filter out recently completed tasks
      const filteredTasks = (data.tasks || []).filter(
        task => !recentlyCompleted.current.has(task.title)
      );
      
      setTasks(filteredTasks);
    } catch (err) {
      console.error('Error fetching work tasks:', err);
      setError(err.message);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addTask = useCallback(async (taskTitle, dueDate = '', notes = '') => {
    try {
      const response = await fetch('/.netlify/functions/add-work-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskTitle, dueDate, notes }),
      });
      
      if (!response.ok) throw new Error('Failed to add work task');
      
      // Refresh the list
      await fetchTasks();
      return true;
    } catch (err) {
      console.error('Error adding work task:', err);
      setError(err.message);
      return false;
    }
  }, [fetchTasks]);

  const completeTask = useCallback(async (task) => {
    try {
      // Add to recently completed to prevent it from reappearing
      recentlyCompleted.current.add(task.title);
      
      // Optimistically remove from UI
      setTasks(prev => prev.filter(t => t.id !== task.id));
      
      const response = await fetch('/.netlify/functions/complete-work-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task.title, taskId: task.id }),
      });
      
      if (!response.ok) {
        // Revert on failure
        recentlyCompleted.current.delete(task.title);
        await fetchTasks();
        throw new Error('Failed to complete work task');
      }
      
      // Keep the task in recentlyCompleted for 2 minutes to allow Zapier to process
      setTimeout(() => {
        recentlyCompleted.current.delete(task.title);
      }, 2 * 60 * 1000);
      
      return true;
    } catch (err) {
      console.error('Error completing work task:', err);
      setError(err.message);
      return false;
    }
  }, [fetchTasks]);

  // Fetch on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchTasks, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch: fetchTasks,
    addTask,
    completeTask,
  };
}
