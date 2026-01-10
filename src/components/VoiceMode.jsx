import React from 'react';
import { MessageSquare } from 'lucide-react';
import { VoiceOrb } from './VoiceOrb';
import { RemindersPanel } from './RemindersPanel';
import { CalendarPanel } from './CalendarPanel';

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
}) {
  return (
    <div className="h-full flex flex-col p-4 gap-4">
      {/* Main Dashboard Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Left Panel - Reminders */}
        <div className="h-full min-h-[200px] md:min-h-0">
          <RemindersPanel 
            reminders={reminders || []} 
            isLoading={remindersLoading}
            onReminderClick={onReminderClick}
            onCompleteReminder={onCompleteReminder}
            onAddReminder={onAddReminder}
          />
        </div>
        
        {/* Center - Voice Orb */}
        <div className="h-full min-h-[300px] md:min-h-0 flex flex-col bg-white/5 border border-white/10 rounded-2xl relative">
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
