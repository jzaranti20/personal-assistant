import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Volume2, VolumeX } from 'lucide-react';

export function ChatMessage({ message, onSpeak, isSpeaking, onStopSpeaking }) {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`message-enter flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div 
        className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border
          ${isUser 
            ? 'bg-white text-black border-white' 
            : 'bg-black text-white border-white/20'
          }
        `}
      >
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <span className="font-display text-sm font-bold">J</span>
        )}
      </div>
      
      {/* Message content */}
      <div 
        className={`
          flex-1 max-w-[80%] p-4 rounded-2xl
          ${isUser 
            ? 'bg-white text-black rounded-tr-sm' 
            : 'bg-white/5 border border-white/10 rounded-tl-sm'
          }
        `}
      >
        {/* Message header */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium tracking-wide uppercase ${isUser ? 'text-black/50' : 'text-white/50'}`}>
            {isUser ? 'You' : 'Jazzy'}
          </span>
          
          {/* Text-to-speech button for assistant messages */}
          {!isUser && (
            <button
              onClick={() => isSpeaking ? onStopSpeaking() : onSpeak(message.content)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeaking ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white/50 hover:text-white" />
              )}
            </button>
          )}
        </div>
        
        {/* Message text */}
        <div className={`markdown-content text-sm leading-relaxed ${isUser ? 'text-black/80' : 'text-white/80'}`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`mt-2 text-xs ${isUser ? 'text-black/30' : 'text-white/30'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="message-enter flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-black text-white border border-white/20">
        <span className="font-display text-sm font-bold">J</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/50 tracking-wide uppercase mr-2">Jazzy is thinking</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white typing-dot"></div>
            <div className="w-2 h-2 rounded-full bg-white typing-dot"></div>
            <div className="w-2 h-2 rounded-full bg-white typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
