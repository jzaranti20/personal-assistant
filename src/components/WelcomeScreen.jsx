import React from 'react';
import { Sparkles, Brain, Mic, Calendar, ListTodo, MessageSquare } from 'lucide-react';

export function WelcomeScreen({ onSuggestionClick }) {
  const suggestions = [
    {
      icon: Brain,
      text: "Help me brainstorm ideas",
      query: "I need help brainstorming ideas for a creative project. Can you help me get started?"
    },
    {
      icon: Calendar,
      text: "Plan my week",
      query: "Help me create a productive weekly plan. What questions should I consider?"
    },
    {
      icon: ListTodo,
      text: "Create a task list",
      query: "I need to organize my tasks. Can you help me create a prioritized to-do list?"
    },
    {
      icon: MessageSquare,
      text: "Draft a message",
      query: "I need help drafting a professional email. Can you guide me through it?"
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/60 text-sm mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Claude</span>
        </div>
        
        <h2 className="font-display text-4xl md:text-5xl font-semibold mb-4">
          <span className="text-white">Hello,</span>
          <span className="text-white/60"> I'm Jazzy</span>
        </h2>
        
        <p className="text-white/40 text-lg max-w-md mx-auto leading-relaxed">
          Your personal AI assistant. Ask me anything or select from the options below.
        </p>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.query)}
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-200 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <suggestion.icon className="w-5 h-5 text-white/70" />
              </div>
              <span className="text-white/70 group-hover:text-white transition-colors">
                {suggestion.text}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Voice hint */}
      <div className="mt-12 flex items-center gap-2 text-white/30 text-sm">
        <Mic className="w-4 h-4" />
        <span>Or switch to voice mode for hands-free interaction</span>
      </div>
    </div>
  );
}
