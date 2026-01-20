import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechRecognition({ onSpeechEnd } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Clear silence timer
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Start silence timer - will auto-stop after pause in speech
  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current && finalTranscriptRef.current.trim()) {
        recognitionRef.current.stop();
      }
    }, 1500); // 1.5 seconds of silence triggers auto-stop
  }, [clearSilenceTimer]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        
        if (final) {
          finalTranscriptRef.current += final;
          setTranscript(finalTranscriptRef.current);
          startSilenceTimer(); // Reset timer when we get final results
        }
        setInterimTranscript(interim);
        
        // If we have interim results, user is still speaking
        if (interim) {
          clearSilenceTimer();
        }
      };

      recognitionRef.current.onspeechend = () => {
        // Start timer when speech ends
        startSilenceTimer();
      };

      recognitionRef.current.onerror = (event) => {
        if (event.error !== 'aborted') {
          setError(event.error);
        }
        setIsListening(false);
        clearSilenceTimer();
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        clearSilenceTimer();
        
        // Auto-submit if we have a transcript
        const finalText = finalTranscriptRef.current.trim();
        if (finalText && onSpeechEnd) {
          onSpeechEnd(finalText);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearSilenceTimer();
    };
  }, [startSilenceTimer, clearSilenceTimer, onSpeechEnd]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      clearSilenceTimer();
    }
  }, [isListening, clearSilenceTimer]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
