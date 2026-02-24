/**
 * Custom hook for speech recognition using Web Speech API
 * Provides voice-to-text functionality for chat input
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Extend Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type RecognitionState = 'idle' | 'listening' | 'processing' | 'error';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  state: RecognitionState;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [state, setState] = useState<RecognitionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);

  // Check if speech recognition is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition once
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.continuous = false; // Stop after single phrase
    recognition.interimResults = true; // Show interim results
    recognition.lang = 'en-US'; // Set language
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      // Update transcript with final or interim results
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setState('processing');
      } else if (interimTranscript) {
        setTranscript(interimTranscript);
        setState('listening');
      }
    };

    // Handle start
    recognition.onstart = () => {
      isListeningRef.current = true;
      isStartingRef.current = false;
      setIsListening(true);
      setState('listening');
      setError(null);
      
      // Haptic feedback on start (mobile vibration)
      if ('vibrate' in navigator) {
        navigator.vibrate(50); // Short vibration (50ms)
      }
    };

    // Handle end
    recognition.onend = () => {
      isListeningRef.current = false;
      isStartingRef.current = false;
      setIsListening(false);
      setState((prevState) => {
        // Only reset to idle if we're not in error or processing state
        if (prevState === 'listening') {
          return 'idle';
        }
        return prevState;
      });
      
      // Haptic feedback on end (mobile vibration)
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 30]); // Double vibration pattern (30ms on, 30ms off, 30ms on)
      }
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      isListeningRef.current = false;
      isStartingRef.current = false;
      
      // Ignore "aborted" errors as they're expected when stopping
      if (event.error === 'aborted') {
        console.log('Speech recognition aborted (expected)');
        setIsListening(false);
        setState('idle');
        return;
      }

      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setState('error');
      
      // Provide user-friendly error messages
      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('Microphone not found. Please check your device.');
          break;
        case 'not-allowed':
          setError('Microphone access denied. Please enable microphone permissions.');
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError(`Recognition error. Please try again.`);
      }
      
      // Auto-clear error after 3 seconds
      setTimeout(() => {
        setError(null);
        setState('idle');
      }, 3000);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isSupported]); // Only depend on isSupported, not state

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      setState('error');
      return;
    }

    // Prevent multiple simultaneous start attempts
    if (isListeningRef.current || isStartingRef.current) {
      return;
    }

    if (recognitionRef.current) {
      try {
        isStartingRef.current = true;
        setTranscript('');
        setError(null);
        setState('idle');
        recognitionRef.current.start();
      } catch (err: any) {
        isStartingRef.current = false;
        console.error('Error starting recognition:', err);
        // If already started, ignore the error
        if (err.message && err.message.includes('already started')) {
          return;
        }
        setError('Failed to start. Please try again.');
        setState('error');
        
        // Auto-clear error
        setTimeout(() => {
          setError(null);
          setState('idle');
        }, 3000);
      }
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
        // Force reset state even if stop fails
        isListeningRef.current = false;
        isStartingRef.current = false;
        setIsListening(false);
        setState('idle');
      }
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setState('idle');
  }, []);

  return {
    isListening,
    transcript,
    state,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
};

