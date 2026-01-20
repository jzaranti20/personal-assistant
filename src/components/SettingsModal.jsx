import React, { useState } from 'react';
import { X, Key } from 'lucide-react';

export function SettingsModal({ 
  isOpen, 
  onClose, 
  apiKey, 
  onApiKeyChange
}) {
  const [tempApiKey, setTempApiKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onApiKeyChange(tempApiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-black border border-white/20 rounded-2xl p-6 w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Key section */}
        <div className="mb-6">
          <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
            <Key className="w-4 h-4 text-white/50" />
            Anthropic API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-ant-api..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 text-sm"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="mt-2 text-xs text-white/30">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>

        {/* Voice info */}
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-sm text-white/50">
            🎙️ Voice powered by ElevenLabs for natural, realistic speech.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 rounded-xl bg-white text-black hover:bg-white/90 transition-colors font-medium"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
