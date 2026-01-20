import React, { useState } from 'react';
import { CheckCircle, Circle, Plus, X, Check, ListTodo, Briefcase, ExternalLink } from 'lucide-react';

export function TasksPanel({ 
  reminders = [], 
  remindersLoading,
  onCompleteReminder,
  onAddReminder,
  workTasks = [],
  workTasksLoading,
  onAddWorkTask,
  onCompleteWorkTask,
}) {
  const [showAddPersonalForm, setShowAddPersonalForm] = useState(false);
  const [showAddWorkForm, setShowAddWorkForm] = useState(false);
  const [newPersonalTask, setNewPersonalTask] = useState('');
  const [newWorkTask, setNewWorkTask] = useState('');

  const handleAddReminder = () => {
    if (newPersonalTask.trim() && onAddReminder) {
      onAddReminder(newPersonalTask.trim());
      setNewPersonalTask('');
      setShowAddPersonalForm(false);
    }
  };

  const handleAddWorkTask = async () => {
    if (newWorkTask.trim()) {
      if (onAddWorkTask) {
        await onAddWorkTask(newWorkTask.trim());
      }
      setNewWorkTask('');
      setShowAddWorkForm(false);
    }
  };

  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Top 50% - Personal Reminders (Apple) */}
      <div className="h-[50%] flex flex-col border-b border-white/10">
        {/* Header */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#800020]" />
            <span className="text-sm font-medium text-white/80">Personal</span>
            <span className="text-xs text-white/40">{reminders.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="x-apple-reminderkit://"
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Open Reminders App"
            >
              <ExternalLink className="w-4 h-4 text-white/40 hover:text-white/60" />
            </a>
            <button
              onClick={() => setShowAddPersonalForm(!showAddPersonalForm)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
        
        {/* Add Personal Form */}
        {showAddPersonalForm && (
          <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={newPersonalTask}
              onChange={(e) => setNewPersonalTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddReminder()}
              placeholder="New reminder..."
              className="flex-1 bg-white/10 rounded px-2 py-1 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-[#800020]"
              autoFocus
            />
            <button
              onClick={handleAddReminder}
              className="p-1 hover:bg-white/10 rounded text-green-400"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowAddPersonalForm(false); setNewPersonalTask(''); }}
              className="p-1 hover:bg-white/10 rounded text-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Personal Reminders List */}
        <div className="flex-1 overflow-y-auto p-2">
          {remindersLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-white/20 border-t-[#800020] rounded-full animate-spin"></div>
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
              <ListTodo className="w-6 h-6 mb-1 opacity-50" />
              <p className="text-xs">No reminders</p>
            </div>
          ) : (
            <div className="space-y-1">
              {reminders.map((reminder, index) => (
                <div
                  key={reminder.id || index}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <button
                    onClick={() => onCompleteReminder && onCompleteReminder(reminder)}
                    className="mt-0.5 text-white/30 hover:text-[#800020] transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90">{reminder.task || reminder.title}</p>
                    {reminder.dueDate && (
                      <p className="text-xs text-white/40">{formatDueDate(reminder.dueDate)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom 50% - Work Tasks (Google) */}
      <div className="h-[50%] flex flex-col">
        {/* Header */}
        <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-white/60" />
            <span className="text-sm font-medium text-white/80">Work</span>
            <span className="text-xs text-white/40">{workTasks.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddWorkForm(!showAddWorkForm)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Plus className="w-4 h-4 text-white/60" />
            </button>
            <a
              href="https://calendar.google.com/calendar/u/0/r/tasks"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-white/40" />
            </a>
          </div>
        </div>

        {/* Add Work Task Form */}
        {showAddWorkForm && (
          <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={newWorkTask}
              onChange={(e) => setNewWorkTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWorkTask()}
              placeholder="New work task..."
              className="flex-1 bg-white/10 rounded px-2 py-1 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/40"
              autoFocus
            />
            <button
              onClick={handleAddWorkTask}
              className="p-1 hover:bg-white/10 rounded text-green-400"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowAddWorkForm(false); setNewWorkTask(''); }}
              className="p-1 hover:bg-white/10 rounded text-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Work Tasks List */}
        <div className="flex-1 overflow-y-auto p-2">
          {workTasksLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
            </div>
          ) : workTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
              <Briefcase className="w-6 h-6 mb-1 opacity-50" />
              <p className="text-xs">No work tasks</p>
            </div>
          ) : (
            <div className="space-y-1">
              {workTasks.map((task, index) => (
                <div
                  key={task.id || index}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <button
                    onClick={() => onCompleteWorkTask && onCompleteWorkTask(task)}
                    className="mt-0.5 text-white/30 hover:text-white transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-white/40">{formatDueDate(task.dueDate)}</p>
                    )}
                  </div>
                  {task.attachment && (
                    <a
                      href={task.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-white/60"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
