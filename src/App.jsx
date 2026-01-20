import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatMessage, TypingIndicator } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { VoiceMode } from './components/VoiceMode';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SettingsModal } from './components/SettingsModal';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useElevenLabs } from './hooks/useElevenLabs';
import { useReminders } from './hooks/useReminders';
import { useCalendar } from './hooks/useCalendar';
import { useWorkTasks } from './hooks/useWorkTasks';
import { useEmails } from './hooks/useEmails';
import { sendMessage, getDefaultSystemPrompt } from './utils/api';

// Phrases that end the conversation
const END_PHRASES = [
  'thank you', 'thanks', 'goodbye', 'bye', 'that\'s all', 
  'that\'s it', 'i\'m done', 'stop', 'end', 'quit', 'exit',
  'good night', 'see you', 'later'
];

// Phrases that indicate a reminder request
const REMINDER_PHRASES = [
  'remind me', 'add a reminder', 'create a reminder', 'new reminder',
  'add to my reminders', 'set a reminder', 'remember to'
];

function App() {
  // Mode state - default to voice
  const [mode, setMode] = useState('voice');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Continuous conversation mode
  const [conversationActive, setConversationActive] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // API key (stored in localStorage)
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('anthropic_api_key') || '';
  });

  // Refs
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);
  const modeRef = useRef(mode);
  const conversationActiveRef = useRef(conversationActive);
  const inactivityTimerRef = useRef(null);
  const shouldRestartListening = useRef(false);

  // Reminders hook
  const { reminders, isLoading: remindersLoading, addReminder, completeReminder, fetchReminders } = useReminders();

  // Calendar hook
  const { 
    selectedDate, 
    workEvents, 
    familyEvents, 
    allEvents, 
    isLoading: calendarLoading,
    goToDate,
    goToPrevDay,
    goToNextDay,
    goToToday,
  } = useCalendar();

  // Work tasks hook
  const { tasks: workTasks, isLoading: workTasksLoading, addTask: addWorkTask, completeTask: completeWorkTask } = useWorkTasks();

  // Emails hook
  const { emails, isLoading: emailsLoading, markAsRead: markEmailRead, markAllAsRead: markAllEmailsRead, draftReply: createDraft } = useEmails();

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    conversationActiveRef.current = conversationActive;
  }, [conversationActive]);

  // Callback when Jazzy finishes speaking - restart listening
  const handleSpeechEnd = useCallback(() => {
    console.log('Speech ended, conversation active:', conversationActiveRef.current);
    if (conversationActiveRef.current && modeRef.current === 'voice') {
      shouldRestartListening.current = true;
      // Small delay then start listening
      setTimeout(() => {
        if (conversationActiveRef.current && shouldRestartListening.current) {
          console.log('Restarting listening...');
          startListeningRef.current?.();
        }
      }, 300);
    }
  }, []);

  // ElevenLabs speech with callback when done speaking
  const {
    isSpeaking,
    isSupported: speechSynthesisSupported,
    speak,
    stop: stopSpeaking,
  } = useElevenLabs({
    onSpeechEnd: handleSpeechEnd,
  });

  // Check if message ends conversation
  const shouldEndConversation = useCallback((text) => {
    const lowerText = text.toLowerCase().trim();
    return END_PHRASES.some(phrase => 
      lowerText.includes(phrase) || lowerText === phrase
    );
  }, []);

  // Check if message is a reminder request
  const isReminderRequest = useCallback((text) => {
    const lowerText = text.toLowerCase();
    return REMINDER_PHRASES.some(phrase => lowerText.includes(phrase));
  }, []);

  // Extract reminder details from text
  const extractReminderDetails = useCallback((text) => {
    // Simple extraction - can be enhanced with AI later
    let task = text;
    
    // Remove common prefixes
    REMINDER_PHRASES.forEach(phrase => {
      const regex = new RegExp(phrase + '\\s*(to\\s*)?', 'gi');
      task = task.replace(regex, '');
    });
    
    // Clean up
    task = task.trim();
    task = task.charAt(0).toUpperCase() + task.slice(1);
    
    return { task };
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      console.log('Inactivity timeout - ending conversation');
      setConversationActive(false);
    }, 60000); // 60 seconds of inactivity
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content) => {
    if (!content.trim() || isLoading) return;
    
    shouldRestartListening.current = false;
    
    // Check if user wants to end conversation
    if (shouldEndConversation(content)) {
      setConversationActive(false);
    }
    
    resetInactivityTimer();

    // Check if this is a reminder request
    if (isReminderRequest(content)) {
      const { task } = extractReminderDetails(content);
      
      if (task) {
        // Add reminder
        const result = await addReminder(task);
        
        const userMessage = {
          role: 'user',
          content: content.trim(),
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        
        const response = result.success 
          ? `Done! I've added "${task}" to your reminders.`
          : `Sorry, I couldn't add that reminder. Please try again.`;
        
        const assistantMessage = {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        if (modeRef.current === 'voice') {
          speak(response);
        }
        
        return;
      }
    }
    
    const userMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Include reminders context in the system prompt
      const reminderContext = reminders.length > 0
        ? `\n\nThe user has these active reminders:\n${reminders.map(r => `- ${r.task}${r.dueDate ? ` (due: ${r.dueDate})` : ''}`).join('\n')}`
        : '\n\nThe user has no active reminders.';
      
      const systemPrompt = getDefaultSystemPrompt() + reminderContext;
      
      const apiMessages = [...messagesRef.current, userMessage].map(({ role, content }) => ({
        role,
        content,
      }));

      const response = await sendMessage(apiMessages, systemPrompt);
      
      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak in voice mode
      if (modeRef.current === 'voice') {
        speak(response);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to get response.');
      setConversationActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, speak, shouldEndConversation, resetInactivityTimer, isReminderRequest, extractReminderDetails, addReminder, reminders]);

  // Speech recognition with auto-submit
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: speechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    onSpeechEnd: handleSendMessage,
  });

  // Store startListening in ref for callback access
  const startListeningRef = useRef(startListening);
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Start continuous conversation
  const startConversation = useCallback(() => {
    console.log('Starting conversation');
    setConversationActive(true);
    resetInactivityTimer();
    startListening();
  }, [startListening, resetInactivityTimer]);

  // End continuous conversation
  const endConversation = useCallback(() => {
    console.log('Ending conversation');
    setConversationActive(false);
    shouldRestartListening.current = false;
    stopListening();
    stopSpeaking();
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, [stopListening, stopSpeaking]);

  // Handle reminder click
  const handleReminderClick = useCallback((reminder) => {
    // For now, just speak the reminder
    if (modeRef.current === 'voice') {
      speak(`Reminder: ${reminder.task}${reminder.dueDate ? `, due ${reminder.dueDate}` : ''}`);
    }
  }, [speak]);

  // Save API key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('anthropic_api_key', apiKey);
    }
  }, [apiKey]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    stopSpeaking();
    resetTranscript();
    setConversationActive(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (query) => {
    handleSendMessage(query);
  };

  // Get last assistant response for voice mode
  const lastResponse = messages
    .filter(m => m.role === 'assistant')
    .slice(-1)[0]?.content;

  return (
    <div className="h-screen flex flex-col bg-mesh noise-overlay">
      {/* Header */}
      <Header 
        mode={mode}
        onModeChange={setMode}
        onClearChat={handleClearChat}
        hasMessages={messages.length > 0}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {mode === 'chat' ? (
          <div className="h-full flex flex-col max-w-4xl mx-auto">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {messages.length === 0 ? (
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={index}
                      message={message}
                      onSpeak={speak}
                      isSpeaking={isSpeaking}
                      onStopSpeaking={stopSpeaking}
                    />
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-white/10">
              <div className="max-w-3xl mx-auto">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={isLoading}
                  isListening={isListening}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  transcript={transcript}
                  interimTranscript={interimTranscript}
                  speechSupported={speechRecognitionSupported}
                />
                <p className="text-center text-xs text-white/30 mt-3">
                  Jazzy can make mistakes. Consider checking important information.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <VoiceMode
            isListening={isListening}
            isSpeaking={isSpeaking}
            conversationActive={conversationActive}
            onStartConversation={startConversation}
            onEndConversation={endConversation}
            onStopSpeaking={stopSpeaking}
            transcript={transcript}
            interimTranscript={interimTranscript}
            isProcessing={isLoading}
            lastResponse={lastResponse}
            onSwitchToChat={() => setMode('chat')}
            reminders={reminders}
            remindersLoading={remindersLoading}
            onReminderClick={handleReminderClick}
            onCompleteReminder={completeReminder}
            onAddReminder={addReminder}
            workEvents={workEvents}
            familyEvents={familyEvents}
            allEvents={allEvents}
            calendarLoading={calendarLoading}
            selectedDate={selectedDate}
            onPrevDay={goToPrevDay}
            onNextDay={goToNextDay}
            onSelectDate={goToDate}
            onGoToToday={goToToday}
            workTasks={workTasks}
            workTasksLoading={workTasksLoading}
            onAddWorkTask={addWorkTask}
            onCompleteWorkTask={completeWorkTask}
            emails={emails}
            emailsLoading={emailsLoading}
            onMarkEmailRead={markEmailRead}
            onMarkAllEmailsRead={markAllEmailsRead}
            onCreateDraft={createDraft}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
      />

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-black border border-white/20 rounded-xl text-white text-sm animate-slide-up">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
