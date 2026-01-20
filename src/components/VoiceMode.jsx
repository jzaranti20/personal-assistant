import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { VoiceOrb } from './VoiceOrb';
import { TasksPanel } from './TasksPanel';
import { CalendarPanel } from './CalendarPanel';
import { EmailPanel } from './EmailPanel';

export function VoiceMode({ 
  isListening,
  isSpeaking,
  conversationActive,
  onStartConversation,
  onEndConversation,
  onStopSpeaking,
  transcript,
  interimTranscript,
  isProcessing,
  lastResponse,
  onSwitchToChat,
  reminders,
  remindersLoading,
  onReminderClick,
  onCompleteReminder,
  onAddReminder,
  workEvents,
  familyEvents,
  allEvents,
  calendarLoading,
  selectedDate,
  onPrevDay,
  onNextDay,
  onSelectDate,
  onGoToToday,
  workTasks,
  workTasksLoading,
  onAddWorkTask,
  onCompleteWorkTask,
  emails,
  emailsLoading,
  onMarkEmailRead,
  onMarkAllEmailsRead,
  onCreateDraft,
}) {
  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Main Dashboard Grid - 3 columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Left Panel - Tasks (Personal + Work) */}
        <div className="h-full min-h-[200px] md:min-h-0">
          <TasksPanel 
            reminders={reminders || []} 
            remindersLoading={remindersLoading}
            onCompleteReminder={onCompleteReminder}
            onAddReminder={onAddReminder}
            workTasks={workTasks || []}
            workTasksLoading={workTasksLoading}
            onAddWorkTask={onAddWorkTask}
            onCompleteWorkTask={onCompleteWorkTask}
          />
        </div>
        
        {/* Center Column - Split: Email (33%) / Voice Orb (33%) / Future (33%) */}
        <div className="h-full min-h-[400px] md:min-h-0 flex flex-col gap-4">
          {/* Top 33% - Email */}
          <div className="h-[33%] min-h-[150px]">
            <EmailPanel 
              emails={emails || []}
              isLoading={emailsLoading}
              onMarkAsRead={onMarkEmailRead}
              onMarkAllAsRead={onMarkAllEmailsRead}
              onCreateDraft={onCreateDraft}
            />
          </div>
          
          {/* Middle 33% - Voice Orb */}
          <div className="h-[33%] min-h-[150px] flex flex-col bg-white/5 border border-white/10 rounded-2xl relative">
            <VoiceOrb
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
              conversationActive={conversationActive}
              onStartConversation={onStartConversation}
              onEndConversation={onEndConversation}
              onStopSpeaking={onStopSpeaking}
            />
          </div>
          
          {/* Bottom 33% - Future Functionality */}
          <div className="h-[33%] min-h-[150px] flex flex-col items-center justify-center bg-white/5 border border-white/10 rounded-2xl">
            <Sparkles className="w-6 h-6 text-white/20 mb-2" />
            <p className="text-xs text-white/30">Coming Soon</p>
          </div>
        </div>
        
        {/* Right Panel - Calendar */}
        <div className="h-full min-h-[200px] md:min-h-0">
          <CalendarPanel 
            workEvents={workEvents || []}
            familyEvents={familyEvents || []}
            allEvents={allEvents || []}
            isLoading={calendarLoading}
            selectedDate={selectedDate || new Date()}
            onPrevDay={onPrevDay}
            onNextDay={onNextDay}
            onSelectDate={onSelectDate}
            onGoToToday={onGoToToday}
          />
        </div>
      </div>
      
      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-2">
        {/* Switch to chat */}
        <button
          onClick={onSwitchToChat}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white hover:border-white/30 transition-colors text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat mode</span>
        </button>
        
        {/* Instructions */}
        <p className="text-xs text-white/20">
          {conversationActive 
            ? 'Say "goodbye" to end' 
            : 'Tap the orb to talk with Jazzy'}
        </p>
        
        {/* Future: More integration toggles */}
        <div className="w-24"></div>
      </div>
    </div>
  );
}
