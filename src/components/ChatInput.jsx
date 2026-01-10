import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Square } from 'lucide-react';

export function ChatInput({ 
  onSend, 
  disabled, 
  isListening, 
  onStartListening, 
  onStopListening,
  transcript,
  interimTranscript,
  speechSupported 
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const handleSubmit = () => {
    const message = input.trim();
    if (message && !disabled) {
      onSend(message);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      onStopListening();
      // Auto-send after stopping if there's content
      setTimeout(() => {
        if (input.trim()) {
          handleSubmit();
        }
      }, 300);
    } else {
      setInput('');
      onStartListening();
    }
  };

  const displayText = isListening 
    ? (transcript + (interimTranscript ? ` ${interimTranscript}` : '')) || 'Listening...'
    : input;

  return (
    <div className="relative">
      {/* Input container */}
      <div className={`
        bg-white/5 border border-white/10 rounded-2xl p-2 flex items-end gap-2 transition-all duration-300
        ${isListening ? 'border-white/40' : 'focus-within:border-white/30'}
      `}>
        {/* Voice button */}
        {speechSupported && (
          <button
            onClick={handleVoiceToggle}
            disabled={disabled}
            className={`
              flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
              transition-all duration-200 border
              ${isListening 
                ? 'bg-white text-black border-white' 
                : 'bg-transparent border-white/20 hover:border-white/40 text-white/60 hover:text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <Square className="w-4 h-4" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={(e) => !isListening && setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Jazzy..."
          disabled={disabled || isListening}
          rows={1}
          className={`
            flex-1 bg-transparent border-none outline-none resize-none
            text-white placeholder-white/30 py-2 px-2
            font-body text-sm leading-relaxed
            disabled:opacity-50
            ${isListening ? 'text-white/80' : ''}
          `}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || (!input.trim() && !transcript.trim())}
          className={`
            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
            bg-white text-black
            transition-all duration-200
            hover:bg-white/90
            disabled:opacity-30 disabled:cursor-not-allowed
          `}
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Voice listening indicator */}
      {isListening && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 border border-white/20 rounded-full">
          <div className="flex items-center gap-2">
            <div className="relative w-3 h-3">
              <div className="absolute inset-0 rounded-full bg-white animate-ping"></div>
              <div className="relative rounded-full w-3 h-3 bg-white"></div>
            </div>
            <span className="text-xs text-white font-medium">Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
}
