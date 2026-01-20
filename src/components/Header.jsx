import React from 'react';
import { MessageSquare, Mic, Settings, Trash2 } from 'lucide-react';

export function Header({ mode, onModeChange, onClearChat, hasMessages }) {
  return (
    <header className="bg-black/90 border-b border-white/10 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <span className="text-black font-display text-lg font-bold">J</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-white tracking-wide">Jazzy</h1>
            <p className="text-xs text-white/50 tracking-widest uppercase">Personal Assistant</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mode-toggle flex items-center">
          <div 
            className="mode-toggle-indicator"
            style={{
              width: '50%',
              transform: mode === 'chat' ? 'translateX(0)' : 'translateX(100%)',
            }}
          />
          <button
            onClick={() => onModeChange('chat')}
            className={`
              relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-colors duration-300
              ${mode === 'chat' ? 'text-black' : 'text-white/60 hover:text-white/80'}
            `}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => onModeChange('voice')}
            className={`
              relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              transition-colors duration-300
              ${mode === 'voice' ? 'text-black' : 'text-white/60 hover:text-white/80'}
            `}
          >
            <Mic className="w-4 h-4" />
            Voice
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasMessages && (
            <button
              onClick={onClearChat}
              className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
