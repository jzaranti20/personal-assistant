import { useState, useCallback, useRef, useEffect } from 'react';

export function useElevenLabs({ onSpeechEnd } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep callback ref updated
  useEffect(() => {
    onSpeechEndRef.current = onSpeechEnd;
  }, [onSpeechEnd]);

  const speak = useCallback(async (text) => {
    if (!text) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onplay = () => {
        setIsSpeaking(true);
      };
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        // Trigger callback when speech ends
        if (onSpeechEndRef.current) {
          onSpeechEndRef.current();
        }
      };
      
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        setError('Failed to play audio');
      };
      
      setIsLoading(false);
      await audioRef.current.play();
    } catch (err) {
      console.error('ElevenLabs error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    isLoading,
    isSupported: true,
    error,
    speak,
    stop,
  };
}
