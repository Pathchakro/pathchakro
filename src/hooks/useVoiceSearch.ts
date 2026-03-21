'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface UseVoiceSearchProps {
    onResult: (transcript: string) => void;
    lang?: string;
    customToastMessage?: string;
}

export function useVoiceSearch({ onResult, lang = 'bn-BD', customToastMessage }: UseVoiceSearchProps) {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const onResultRef = useRef(onResult);

    // Update ref when onResult changes
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        let recog: any = null;
        if (typeof window !== 'undefined') {
            const AnyWindow = window as any;
            if (AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition) {
                const SpeechRecognition = AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition;
                recog = new SpeechRecognition();
                recog.continuous = false;
                recog.interimResults = false;
                recog.lang = lang;

                recog.onstart = () => {
                    setIsListening(true);
                    toast.info('Listening...', {
                        description: customToastMessage || (lang.startsWith('bn') ? 'Speak now in Bangla' : 'Speak now'),
                        duration: 3000,
                    });
                };

                recog.onresult = (event: any) => {
                    if (event.results && event.results.length > 0 && event.results[0][0]) {
                        const transcript = event.results[0][0].transcript;
                        if (typeof transcript === 'string' && transcript.trim().length > 0) {
                            onResultRef.current(transcript);
                        }
                    }
                    setIsListening(false);
                };

                recog.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                    if (event.error === 'not-allowed') {
                        toast.error('Microphone access denied', {
                            description: 'Please enable microphone permissions in your browser.',
                        });
                    } else if (event.error === 'no-speech') {
                        toast.error('No speech detected', {
                            description: 'Try speaking more clearly.',
                        });
                    }
                };

                recog.onend = () => {
                    setIsListening(false);
                };

                setRecognition(recog);
            }
        }

        return () => {
            if (recog) {
                try {
                    recog.stop();
                } catch (e) {
                    // Ignore
                }
                recog.onstart = null;
                recog.onresult = null;
                recog.onerror = null;
                recog.onend = null;
            }
            setIsListening(false);
            setRecognition(null);
        };
    }, [lang, customToastMessage]);

    const toggleListening = useCallback(() => {
        if (!recognition) {
            toast.error('Voice search is not supported in this browser.', {
                description: 'Try using Chrome or Edge.',
            });
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (err) {
                console.error('Recognition start error:', err);
                try {
                    recognition.stop();
                } catch (stopErr) {
                    console.error('Secondary error during recognition stop:', stopErr);
                }
            }
        }
    }, [recognition, isListening]);

    return {
        isListening,
        toggleListening,
        supported: !!recognition,
    };
}
