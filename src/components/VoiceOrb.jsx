import React, { useState, useEffect } from 'react';
import { Mic, Volume2, X } from 'lucide-react';

export function VoiceOrb({ 
  isListening,
  isSpeaking,
  isProcessing,
  conversationActive,
  onStartConversation,
  onEndConversation,
  onStopSpeaking,
}) {
  const [pulseRings, setPulseRings] = useState([]);
  
  // Add pulse rings when listening or speaking
  useEffect(() => {
    if (isListening || isSpeaking || isProcessing) {
      const interval = setInterval(() => {
        setPulseRings(prev => [...prev, Date.now()].slice(-3));
      }, 800);
      return () => clearInterval(interval);
    } else {
      setPulseRings([]);
    }
  }, [isListening, isSpeaking, isProcessing]);

  const getStatusText = () => {
    if (isProcessing) return 'Thinking...';
    if (isSpeaking) return 'Speaking...';
    if (isListening) return 'Listening...';
    if (conversationActive) return 'Your turn...';
    return 'Tap to start';
  };

  const handleOrbClick = () => {
    if (conversationActive) {
      onEndConversation();
    } else {
      onStartConversation();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Conversation active indicator */}
      {conversationActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-xs text-white/70">Active</span>
          <button 
            onClick={onEndConversation}
            className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-white/50" />
          </button>
        </div>
      )}

      {/* Main orb container */}
      <div className="relative">
        {/* Pulse rings */}
        {pulseRings.map((id) => (
          <div
            key={id}
            className="voice-ring absolute inset-0"
            style={{ 
              width: '160px', 
              height: '160px',
              top: '50%',
              left: '50%',
              marginTop: '-80px',
              marginLeft: '-80px',
              borderColor: isSpeaking ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)',
            }}
          />
        ))}
        
        {/* Main orb button */}
        <button
          onClick={handleOrbClick}
          disabled={isProcessing}
          className={`
            relative w-40 h-40 rounded-full
            flex items-center justify-center
            transition-all duration-500 ease-out
            border-2
            ${conversationActive
              ? isListening 
                ? 'bg-white text-black border-white scale-110' 
                : isSpeaking
                  ? 'bg-white/20 text-white border-white/60'
                  : isProcessing
                    ? 'bg-white/10 text-white border-white/40'
                    : 'bg-white/10 text-white border-white/40'
              : 'bg-black text-white border-white/30 hover:border-white/60'
            }
            ${isProcessing ? 'animate-pulse-slow' : ''}
            disabled:cursor-not-allowed
          `}
          style={{
            boxShadow: conversationActive
              ? isListening 
                ? '0 0 60px rgba(255, 255, 255, 0.5)' 
                : isSpeaking
                  ? '0 0 60px rgba(255, 255, 255, 0.3)'
                  : '0 0 40px rgba(255, 255, 255, 0.2)'
              : '0 0 40px rgba(255, 255, 255, 0.1)',
          }}
        >
          {conversationActive ? (
            isListening ? (
              <Mic className="w-12 h-12" />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 opacity-50" />
            )
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>
      </div>

      {/* Status text */}
      <p className="mt-6 text-lg font-medium text-white/60">
        {getStatusText()}
      </p>

      {/* Stop speaking button */}
      {isSpeaking && (
        <button
          onClick={onStopSpeaking}
          className="mt-4 px-4 py-2 text-xs bg-white/10 border border-white/20 rounded-full text-white/60 hover:bg-white/20 transition-colors"
        >
          Interrupt
        </button>
      )}
    </div>
  );
}
