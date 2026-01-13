import React from 'react';
import { Plus } from 'lucide-react';

export function PlaceholderPanel({ title, icon: Icon, description }) {
  return (
    <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-white/60" />}
        <h2 className="text-sm font-medium text-white/80">{title}</h2>
      </div>
      
      {/* Placeholder Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-white/20">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-3">
          <Plus className="w-5 h-5" />
        </div>
        <p className="text-sm text-center">{description || 'Coming soon'}</p>
      </div>
    </div>
  );
}
