import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

export function CalendarPanel({ 
  selectedDate,
  onPrevDay,
  onNextDay,
  onSelectDate,
  onGoToToday,
}) {
  const [familyEvents, setFamilyEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Format selected date
  const dateString = selectedDate?.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) || '';

  // Check if selected date is today
  const isToday = () => {
    if (!selectedDate) return true;
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  // Fetch family calendar
  useEffect(() => {
    const fetchFamily = async () => {
      if (!selectedDate) return;
      setIsLoading(true);
      try {
        // Format date as YYYY-MM-DD using local timezone (not UTC)
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateParam = `${year}-${month}-${day}`;
        
        const response = await fetch(`/.netlify/functions/get-family-calendar?date=${dateParam}`);
        if (response.ok) {
          const data = await response.json();
          setFamilyEvents(data.events || []);
        }
      } catch (err) {
        console.error('Error fetching family calendar:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFamily();
  }, [selectedDate]);

  // Format time from ISO string
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Calculate duration
  const getDuration = (start, end) => {
    if (!start || !end) return '';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Toggle event expansion
  const toggleExpand = (eventId) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  // Date picker component
  const DatePicker = () => {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    const handleDayClick = (day) => {
      if (!day) return;
      const newDate = new Date(year, month, day);
      onSelectDate(newDate);
      setShowDatePicker(false);
    };
    
    const isSelectedDay = (day) => {
      if (!day) return false;
      return selectedDate.getDate() === day && 
             selectedDate.getMonth() === month && 
             selectedDate.getFullYear() === year;
    };
    
    const isTodayDay = (day) => {
      if (!day) return false;
      const today = new Date();
      return today.getDate() === day && 
             today.getMonth() === month && 
             today.getFullYear() === year;
    };
    
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-white/20 rounded-xl p-3 z-50 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-white/10 rounded">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <span className="text-sm font-medium text-white/80">{monthName}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-white/10 rounded">
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-[10px] text-white/40 text-center">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDayClick(day)}
              disabled={!day}
              className={`h-7 text-xs rounded transition-all
                ${!day ? 'invisible' : 'hover:bg-white/10'}
                ${isSelectedDay(day) ? 'bg-[#800020] text-white font-bold' : 'text-white/70'}
                ${isTodayDay(day) && !isSelectedDay(day) ? 'ring-1 ring-white/40' : ''}`}
            >
              {day}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => { onGoToToday(); setShowDatePicker(false); }}
          className="w-full mt-3 py-2 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white/70 transition-colors"
        >
          Today
        </button>
      </div>
    );
  };

  // Google Calendar embed URL - dark mode
  const embedUrl = `https://calendar.google.com/calendar/embed?src=jzaranti%40medixteam.com&ctz=America%2FChicago&mode=AGENDA&showTitle=0&showNav=0&showDate=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0&bgcolor=%23121212`;

  return (
    <div className="h-full flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Family Calendar Section - 1/4 height */}
      <div className="h-[25%] flex flex-col min-h-0 border-b border-white/10">
        {/* Header with date navigation */}
        <div className="px-3 py-2 border-b border-white/10">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-1">
              <button onClick={onPrevDay} className="p-1 hover:bg-white/10 rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </button>
              
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                <span className="text-xs font-medium text-white/80">{dateString}</span>
              </button>
              
              <button onClick={onNextDay} className="p-1 hover:bg-white/10 rounded transition-colors">
                <ChevronRight className="w-4 h-4 text-white/60" />
              </button>
            </div>
            
            <div className="flex items-center gap-1 px-2 py-1 bg-[#800020]/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#800020]" />
              <span className="text-[10px] text-[#c0a080]">Family</span>
            </div>
            
            {showDatePicker && <DatePicker />}
          </div>
        </div>
        
        {/* Family Events List */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-4 h-4 border-2 border-white/20 border-t-[#800020] rounded-full animate-spin"></div>
            </div>
          ) : familyEvents.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/30 text-xs">
              No family events
            </div>
          ) : (
            <div className="space-y-0.5">
              {familyEvents.map((event, index) => (
                <div key={event.id || index} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-white/5">
                  <span className="text-[10px] text-white/50 w-12 flex-shrink-0">
                    {event.allDay ? 'All day' : formatTime(event.start)}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#800020] flex-shrink-0" />
                  <span className="text-xs text-white/90 truncate">{event.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Work Calendar Section (Google Embed) - 3/4 height */}
      <div className="h-[75%] flex flex-col">
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="text-[10px] text-white/60">Work</span>
          </div>
          <a 
            href="https://calendar.google.com/calendar/u/0/r" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <iframe
            src={embedUrl}
            style={{
              border: 0,
              width: '100%',
              height: '100%',
              filter: 'invert(1) hue-rotate(180deg)',
            }}
            frameBorder="0"
            scrolling="yes"
          />
        </div>
      </div>
    </div>
  );
}
