import React, { useState, useEffect } from 'react';
import { Check, Clock, Calendar } from 'lucide-react';

export function OrbitingReminders({ reminders, onReminderClick }) {
  const [hoveredId, setHoveredId] = useState(null);
  
  // Limit to 6 reminders max in orbit
  const displayReminders = reminders.slice(0, 6);
  const remainingCount = reminders.length - 6;
  
  // Calculate positions around a circle
  const getPosition = (index, total) => {
    const angle = (index * (360 / total) - 90) * (Math.PI / 180); // Start from top
    const radius = 140; // Distance from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y, angle: index * (360 / total) };
  };

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {displayReminders.map((reminder, index) => {
        const pos = getPosition(index, displayReminders.length);
        const isHovered = hoveredId === reminder.id;
        
        return (
          <div
            key={reminder.id || index}
            className="absolute pointer-events-auto"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            }}
            onMouseEnter={() => setHoveredId(reminder.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <button
              onClick={() => onReminderClick?.(reminder)}
              className={`
                relative flex items-center gap-2 px-3 py-2 
                bg-white/10 backdrop-blur-sm border border-white/20 
                rounded-full text-white text-xs
                transition-all duration-300 ease-out
                hover:bg-white/20 hover:border-white/40 hover:scale-110
                ${isHovered ? 'z-10' : 'z-0'}
              `}
              style={{
                maxWidth: isHovered ? '200px' : '120px',
                animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
              }}
            >
              {reminder.dueDate ? (
                <Calendar className="w-3 h-3 flex-shrink-0 text-white/60" />
              ) : (
                <Clock className="w-3 h-3 flex-shrink-0 text-white/60" />
              )}
              <span className="truncate">
                {reminder.task}
              </span>
            </button>
            
            {/* Expanded tooltip on hover */}
            {isHovered && (reminder.dueDate || reminder.list) && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-black/90 border border-white/20 rounded-lg text-xs whitespace-nowrap z-20">
                {reminder.dueDate && (
                  <div className="text-white/60">Due: {reminder.dueDate}</div>
                )}
                {reminder.list && (
                  <div className="text-white/40">{reminder.list}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Show remaining count if more than 6 */}
      {remainingCount > 0 && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(calc(-50% + 0px), calc(-50% + 160px))',
          }}
        >
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/40 text-xs">
            +{remainingCount} more
          </div>
        </div>
      )}
    </div>
  );
}
