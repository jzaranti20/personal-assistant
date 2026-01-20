import React, { useState } from 'react';
import { Circle, Clock, Calendar, ListTodo, Plus, X, Check } from 'lucide-react';

export function RemindersPanel({ reminders, isLoading, onReminderClick, onCompleteReminder, onAddReminder }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    setIsAdding(true);
    try {
      await onAddReminder?.(newTask.trim());
      setNewTask('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding reminder:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <ListTodo className="w-4 h-4 text-white/60" />
        <h2 className="text-sm font-medium text-white/80">Reminders</h2>
        <span className="text-xs text-white/40">
          {reminders.length}
        </span>
        <button 
          onClick={() => setShowAddForm(true)}
          className="ml-auto p-1 hover:bg-white/10 rounded-full transition-colors"
          title="Add reminder"
        >
          <Plus className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="p-3 border-b border-white/10 bg-white/5">
          <form onSubmit={handleAddSubmit} className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="New reminder..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/40"
              autoFocus
              disabled={isAdding}
            />
            <button
              type="submit"
              disabled={!newTask.trim() || isAdding}
              className="p-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewTask('');
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </form>
        </div>
      )}
      
      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
            <Circle className="w-8 h-8 mb-2 opacity-50" />
            <p>No reminders</p>
            <p className="text-xs mt-1">Tap + to add one</p>
          </div>
        ) : (
          reminders.map((reminder, index) => (
            <div
              key={reminder.id || index}
              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
            >
              {/* Complete button */}
              <button
                onClick={() => onCompleteReminder?.(reminder)}
                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-white/30 hover:border-white/60 hover:bg-white/20 transition-all flex items-center justify-center group/check"
                title="Mark complete"
              >
                <Check className="w-3 h-3 text-white/0 group-hover/check:text-white/60" />
              </button>
              
              {/* Task details */}
              <button
                onClick={() => onReminderClick?.(reminder)}
                className="flex-1 min-w-0 text-left"
              >
                <p className="text-sm text-white/80 truncate">
                  {reminder.task}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {reminder.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Calendar className="w-3 h-3" />
                      {reminder.dueDate}
                    </span>
                  )}
                  {reminder.list && (
                    <span className="text-xs text-white/30">
                      {reminder.list}
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
