"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ttsService } from "@/lib/tts-service";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowLeft,
  MessageSquare,
  User,
  Bot,
  Loader2,
  AlertCircle,
  PlayCircle,
  StopCircle
} from "lucide-react";

// Browser Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ConversationMessage {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function InterviewPracticePage() {
  const router = useRouter();
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Conversation State
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  
  // TTS State
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("interview-tts-enabled");
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  
  // Custom System Prompt State
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const lastTranscriptTimeRef = useRef<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for Speech Recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    } else {
      setSpeechSupported(false);
      setSpeechError("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
    }
  }, []);

  // Update TTS service when enabled state changes
  useEffect(() => {
    ttsService.setEnabled(ttsEnabled);
    localStorage.setItem("interview-tts-enabled", JSON.stringify(ttsEnabled));
  }, [ttsEnabled]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      ttsService.clearQueue();
    };
  }, []);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsListening(true);
      setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      let interimText = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interimText += transcript;
        }
      }

      setInterimTranscript(interimText);

      if (finalText.trim()) {
        const now = Date.now();
        // Debounce: only process if enough time has passed
        if (now - lastTranscriptTimeRef.current > 1500) {
          handleUserSpeech(finalText.trim());
          lastTranscriptTimeRef.current = now;
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        setSpeechError("No speech detected. Please speak clearly.");
      } else if (event.error === "aborted") {
        setSpeechError("Speech recognition was aborted.");
      } else if (event.error === "not-allowed") {
        setSpeechError("Microphone access denied. Please allow microphone access.");
      } else {
        setSpeechError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
      setInterimTranscript("");
      
      // Restart if session is still active
      if (sessionActive && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error("Failed to restart recognition:", error);
        }
      }
    };

    return recognition;
  };

  // Handle user speech input
  const handleUserSpeech = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Call Gemini API
      const response = await fetch('/api/gemini/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: text,
          conversationHistory: conversationHistory,
          customSystemPrompt: useCustomPrompt ? customSystemPrompt : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response from interviewer');
      }

      const data = await response.json();
      const assistantText = data.response;

      // Update conversation history
      setConversationHistory(data.conversationHistory);

      // Add assistant message
      const assistantMessage: DisplayMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response using TTS
      if (ttsEnabled) {
        await ttsService.queueSpeech({
          text: assistantText,
          agentName: 'Interviewer',
          messageId: assistantMessage.id
        });
      }

    } catch (error: any) {
      console.error('Error processing speech:', error);
      const errorMessage: DisplayMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Start interview session
  const startSession = () => {
    if (!speechSupported) {
      setSpeechError("Speech recognition is not supported in your browser.");
      return;
    }

    // Initialize with greeting
    const greeting: DisplayMessage = {
      id: 'greeting',
      role: 'assistant',
      content: "Hello! I'm here to help you practice for your interview. Let's start with an easy one: Tell me a bit about yourself and what brings you here today.",
      timestamp: new Date()
    };
    
    setMessages([greeting]);
    setConversationHistory([{
      role: 'model',
      parts: [{ text: greeting.content }]
    }]);
    
    if (ttsEnabled) {
      ttsService.queueSpeech({
        text: greeting.content,
        agentName: 'Interviewer',
        messageId: greeting.id
      });
    }

    setSessionActive(true);
    
    // Start speech recognition
    const recognition = initializeSpeechRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setSpeechError("Failed to start speech recognition. Please try again.");
      }
    }
  };

  // Stop interview session
  const stopSession = () => {
    setSessionActive(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    setInterimTranscript("");
    ttsService.clearQueue();
  };

  // Reset session
  const resetSession = () => {
    stopSession();
    setMessages([]);
    setConversationHistory([]);
    setIsProcessing(false);
    setSpeechError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Interview Practice</h1>
              <p className="text-gray-600 mt-1">Practice with an AI interviewer using voice</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-gray-600" />
              <Switch
                checked={ttsEnabled}
                onCheckedChange={setTtsEnabled}
              />
              <Volume2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Voice</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Session Controls</CardTitle>
                <CardDescription>
                  Start speaking to begin the interview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!sessionActive ? (
                  <Button
                    onClick={startSession}
                    className="w-full"
                    size="lg"
                    disabled={!speechSupported}
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Start Interview
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={stopSession}
                      className="w-full"
                      size="lg"
                      variant="destructive"
                    >
                      <StopCircle className="w-5 h-5 mr-2" />
                      Stop Interview
                    </Button>
                    <Button
                      onClick={resetSession}
                      className="w-full"
                      variant="outline"
                    >
                      Reset Session
                    </Button>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Microphone</span>
                    <div className="flex items-center gap-2">
                      {isListening ? (
                        <>
                          <Mic className="w-4 h-4 text-green-600 animate-pulse" />
                          <span className="text-xs text-green-600">Listening</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400">Off</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">AI Status</span>
                    <div className="flex items-center gap-2">
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                          <span className="text-xs text-blue-600">Thinking</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400">Ready</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Interim Transcript */}
                {interimTranscript && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <Label className="text-xs text-gray-600">Listening...</Label>
                    <p className="text-sm text-gray-800 italic mt-1">{interimTranscript}</p>
                  </div>
                )}

                {/* Error Display */}
                {speechError && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{speechError}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom System Prompt */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Custom Instructions</CardTitle>
                  <Switch
                    checked={useCustomPrompt}
                    onCheckedChange={setUseCustomPrompt}
                  />
                </div>
                <CardDescription>
                  Customize the interviewer's behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  placeholder="E.g., You are interviewing for a senior software engineer position. Focus on system design and leadership experience..."
                  disabled={!useCustomPrompt || sessionActive}
                  rows={6}
                  className="text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Conversation */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    <CardTitle>Conversation</CardTitle>
                  </div>
                  <span className="text-sm text-gray-500">
                    {messages.length} messages
                  </span>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <Bot className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Ready to start your interview?</p>
                    <p className="text-sm mt-2">Click "Start Interview" to begin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Bot className="w-5 h-5 text-indigo-600" />
                            </div>
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>

                        {message.role === 'user' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
