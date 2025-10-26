"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getScenarioById, generateAgents } from "@/lib/scenarios";
import {
  generateAgentResponse,
  getResponseDelay,
  calculateScore,
  AgentPromptContext,
  initConversationState,
  canGenerateAgentResponse,
  updateStateOnUserMessage,
  advanceAfterAgentResponse,
  selectAgentToSpeak,
} from "@/lib/agent-responses";
import { ttsService } from "@/lib/tts-service";
import { Message, Agent, DifficultyLevel, PresentationalFlow, FlowSection } from "@/types";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Clock,
  Users as UsersIcon,
  ArrowLeft,
  Settings,
  Check,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Presentation,
  BarChart3,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import VoiceAnalysis from "@/components/voice-analysis";

interface PracticePageProps {
  params: Promise<{ scenarioId: string }>;
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

// Browser Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Hardcoded presentation flow for investment presentation
const HARDCODED_FLOW: PresentationalFlow = {
  intro: {
    id: "intro",
    title: "Opening: Why Start Now",
    goals: [
      "Show that $100/month at age 20 becomes $1.1 million at 65",
      "Share three simple steps you can take today"
    ]
  },
  sections: [
    {
      id: "section-1",
      title: "The Only Three Things You Need",
      goals: [
        "1) Open a Roth IRA, 2) Buy index funds (VTI), 3) Automate $50/month",
        "Explain that index funds give instant diversification with 0.04% fees"
      ]
    },
    {
      id: "section-2", 
      title: "Start Today, Not Tomorrow",
      goals: [
        "Waiting 10 years costs you half your retirement money",
        "Download Vanguard app right now - it takes 5 minutes"
      ]
    }
  ],
  conclusion: {
    id: "conclusion",
    title: "Your Action Item",
    goals: [
      "Commit: Open a Roth IRA tonight and invest your first dollar"
    ]
  },
  qa: {
    id: "qa",
    title: "Your Questions",
    goals: [
      "Answer all questions about getting started"
    ]
  }
};

// Q&A questions for presentation
const QA_QUESTIONS = [
  { agentIndex: 0, question: "Can you explain the difference between a 401(k) and an IRA?" },
  { agentIndex: 1, question: "How much money do I actually need to start investing?" },
  { agentIndex: 2, question: "What exactly are expense ratios and why should I care?" },
  { agentIndex: 3, question: "Should I pay off my student loans first or start investing now?" },
  { agentIndex: 0, question: "Is cryptocurrency a good investment for beginners?" },
  { agentIndex: 1, question: "How do I actually open a brokerage account?" },
  { agentIndex: 2, question: "What happens if the stock market crashes right after I invest?" },
  { agentIndex: 3, question: "Can you explain dollar-cost averaging in simple terms?" },
];

export default function PracticePage({ params }: PracticePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const scenario = getScenarioById(resolvedParams.scenarioId);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [convState, setConvState] = useState(() => initConversationState());
  const [userInput, setUserInput] = useState("");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("medium");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceAnalysis, setShowVoiceAnalysis] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");
  const [customDurationSec, setCustomDurationSec] = useState<number | null>(null);
  const [userExtrasForContext, setUserExtrasForContext] = useState<string>("");
  const [talkingPointsForContext, setTalkingPointsForContext] = useState<
    Array<{ text: string; importance: number }>
  >([]);
  const [extractedDocumentText, setExtractedDocumentText] = useState<string>("");
  
  
  // Presentation-specific state
  const [currentFlowSection, setCurrentFlowSection] = useState<string>("intro");
  const [presentationFlow, setPresentationFlow] = useState<PresentationalFlow | null>(null);
  
  // State for Q&A management
  const [qaStartTime, setQaStartTime] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [awaitingUserResponse, setAwaitingUserResponse] = useState(false);
  const [hasAskedInitialQuestion, setHasAskedInitialQuestion] = useState(false);
  
  // TTS State - Always enabled for presentation
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem("tts-enabled");
    return saved ? JSON.parse(saved) : true;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentResponseTimers = useRef<NodeJS.Timeout[]>([]);
  const scheduledTurnRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const qaTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastTranscriptTimeRef = useRef<number>(Date.now());

  // Force TTS on for presentation scenario
  useEffect(() => {
    if (scenario?.id === 'presentation') {
      ttsService.setEnabled(true);
      setTtsEnabled(true);
      console.log('[Setup] TTS force-enabled for presentation');
    } else {
      ttsService.setEnabled(ttsEnabled);
      localStorage.setItem("tts-enabled", JSON.stringify(ttsEnabled));
    }
  }, [ttsEnabled, scenario?.id]);

  // Check for Speech Recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
    } else {
      setSpeechRecognitionSupported(false);
      setSpeechError("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
    }
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
        setUserInput(finalText.trim());
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        // Silently restart
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
      
      // Restart if Q&A is active and we're waiting for user response
      if (qaStartTime && awaitingUserResponse && recognitionRef.current) {
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
  const handleUserSpeech = (text: string) => {
    if (!text.trim() || sessionEnded) return;

    const userMessage: Message = {
      id: `msg-speech-${Date.now()}`,
      agentId: "user",
      agentName: "You",
      content: text,
      timestamp: new Date(),
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    
    console.log(`[handleUserSpeech] Scenario: ${scenario?.id}, QA Started: ${!!qaStartTime}, Awaiting Response: ${awaitingUserResponse}, Question Index: ${currentQuestionIndex}`);
    
    // For presentation scenario during Q&A, trigger next question after user responds
    if (scenario?.id === 'presentation' && qaStartTime && awaitingUserResponse) {
      console.log('[handleUserSpeech] Triggering next Q&A question after speech');
      setAwaitingUserResponse(false);
      askNextQuestion();
    }
  };

  // Start speech recognition when Q&A becomes active
  useEffect(() => {
    if (scenario?.id === 'presentation' && qaStartTime && !sessionEnded && speechRecognitionSupported) {
      // Start speech recognition for Q&A
      if (!recognitionRef.current) {
        const recognition = initializeSpeechRecognition();
        if (recognition) {
          recognitionRef.current = recognition;
          try {
            recognition.start();
            console.log('[STT] Started speech recognition for Q&A');
          } catch (error) {
            console.error("Failed to start recognition:", error);
          }
        }
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [qaStartTime, sessionEnded, speechRecognitionSupported, scenario?.id]);

  // Set presentation flow
  useEffect(() => {
    if (scenario?.id === 'presentation') {
      setPresentationFlow(HARDCODED_FLOW);
    }
  }, [scenario]);

  // Function to ask next question (only called after user speaks)
  const askNextQuestion = useCallback(() => {
    if (currentQuestionIndex >= QA_QUESTIONS.length || sessionEnded || !qaStartTime) {
      console.log('[Q&A] No more questions or session ended');
      return;
    }
    
    if (!agents || agents.length === 0) {
      console.error('[Q&A] No agents available');
      return;
    }
    
    const qa = QA_QUESTIONS[currentQuestionIndex];
    const agent = agents[qa.agentIndex % agents.length];
    
    if (!agent) {
      console.error('[Q&A] No agent found for question', currentQuestionIndex);
      return;
    }
    
    console.log(`[Q&A] Agent ${agent.name} asking question ${currentQuestionIndex + 1}/${QA_QUESTIONS.length} (after user response)`);
    
    // Add a natural delay before asking the next question
    setTimeout(() => {
      if (sessionEnded) return;
      
      const questionMessage: Message = {
        id: `qa-${Date.now()}-${currentQuestionIndex}`,
        agentId: agent.id,
        agentName: agent.name,
        content: qa.question,
        timestamp: new Date(),
        isUser: false,
      };

      setMessages((prev) => [...prev, questionMessage]);
      
      // Queue TTS for question
      console.log(`[TTS] Queueing speech for ${agent.name} with voice ${agent.voiceId}`);
      ttsService.queueSpeech({
        text: qa.question,
        agentName: agent.name,
        messageId: questionMessage.id,
        voiceId: agent.voiceId || 'b5f4515fd395410b9ed3aef6fa51d9a0',
      });
      
      setCurrentQuestionIndex(prev => prev + 1);
      setAwaitingUserResponse(true);
    }, 2000 + Math.random() * 2000); // 2-4 second delay after user speaks
  }, [currentQuestionIndex, sessionEnded, qaStartTime, agents]);

  // Start Q&A session after 30 seconds for presentation
  useEffect(() => {
    if (scenario?.id === 'presentation' && timeElapsed === 30 && !qaStartTime && agents.length > 0 && !sessionEnded) {
      console.log('[Q&A] Starting Q&A session at 30 seconds');
      setQaStartTime(timeElapsed);
      setCurrentFlowSection("qa");
      setAwaitingUserResponse(false);
      
      // Ask the first question to start Q&A
      if (!hasAskedInitialQuestion && agents.length > 0 && currentQuestionIndex < QA_QUESTIONS.length) {
        setTimeout(() => {
          const qa = QA_QUESTIONS[0];
          const agent = agents[qa.agentIndex % agents.length];
          
          if (agent) {
            console.log(`[Q&A] Initial question from ${agent.name}`);
            
            const questionMessage: Message = {
              id: `qa-${Date.now()}-0`,
              agentId: agent.id,
              agentName: agent.name,
              content: qa.question,
              timestamp: new Date(),
              isUser: false,
            };

            setMessages((prev) => [...prev, questionMessage]);
            
            // Queue TTS for initial question
            console.log(`[TTS] Queueing speech for ${agent.name} with voice ${agent.voiceId}`);
            ttsService.queueSpeech({
              text: qa.question,
              agentName: agent.name,
              messageId: questionMessage.id,
              voiceId: agent.voiceId || 'b5f4515fd395410b9ed3aef6fa51d9a0',
            });
            
            setCurrentQuestionIndex(1);
            setAwaitingUserResponse(true);
            setHasAskedInitialQuestion(true);
          }
        }, 2000);
      }
    }
  }, [timeElapsed, qaStartTime, agents, sessionEnded, scenario?.id, hasAskedInitialQuestion, currentQuestionIndex]);

  // Clean up Q&A timer
  useEffect(() => {
    return () => {
      if (qaTimerRef.current) {
        clearTimeout(qaTimerRef.current);
        qaTimerRef.current = null;
      }
    };
  }, []);

  // Load configuration
  const hasLoadedCustomConfigRef = useRef(false);
  useEffect(() => {
    if (!scenario) return;
    if (hasLoadedCustomConfigRef.current) return;
    hasLoadedCustomConfigRef.current = true;
    try {
      const key = `practice-config-${scenario.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const secs = Number(parsed?.timeLimitSeconds);
        if (Number.isFinite(secs) && secs >= 0) {
          setCustomDurationSec(secs);
        }
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
  }, [scenario]);

  // Load context
  useEffect(() => {
    if (!scenario) return;
    try {
      const ctxKey = `practice-context-${scenario.id}`;
      const rawCtx = localStorage.getItem(ctxKey);
      if (rawCtx) {
        const parsed = JSON.parse(rawCtx) as {
          userExtras?: string;
          talkingPoints?: Array<{ text: string; importance: number }>;
          extractedText?: string;
          extractedMeta?: any;
        };
        setUserExtrasForContext(parsed?.userExtras || "");
        setTalkingPointsForContext(
          Array.isArray(parsed?.talkingPoints)
            ? parsed!.talkingPoints!.slice(0, 20)
            : []
        );
        setExtractedDocumentText(parsed?.extractedText || "");
        localStorage.removeItem(ctxKey);
      }
    } catch {
      // ignore
    }
  }, [scenario]);

  // Enumerate media devices
  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
        }));
      setVideoDevices(videoInputs);

      const audioInputs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
        }));
      setAudioDevices(audioInputs);

      if (!selectedVideoDeviceId && videoInputs.length > 0) {
        setSelectedVideoDeviceId(videoInputs[0].deviceId);
      }
      if (!selectedAudioDeviceId && audioInputs.length > 0) {
        setSelectedAudioDeviceId(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };

  // Initialize camera
  const startCamera = async (deviceId?: string) => {
    try {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(null);
      await enumerateDevices();
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Unable to access camera. Please check permissions.");
    }
  };

  // Initialize microphone
  const startMicrophone = async (deviceId?: string) => {
    try {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const constraints: MediaStreamConstraints = {
        video: false,
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      audioStreamRef.current = stream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      setMicError(null);
      await enumerateDevices();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMicError("Unable to access microphone. Please check permissions.");
    }
  };

  // Initial media setup
  useEffect(() => {
    const initMedia = async () => {
      if (isVideoOn) {
        await startCamera();
      }
      await startMicrophone();
    };
    initMedia();
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      ttsService.stopAll();
    };
  }, []);

  // Handle video toggle
  useEffect(() => {
    const toggleCamera = async () => {
      if (isVideoOn && !videoStreamRef.current) {
        await startCamera(selectedVideoDeviceId);
      } else if (!isVideoOn && videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
    toggleCamera();
  }, [isVideoOn]);

  // Handle mute toggle
  useEffect(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  // Handle device changes
  const handleVideoDeviceChange = async (deviceId: string) => {
    setSelectedVideoDeviceId(deviceId);
    if (isVideoOn) {
      await startCamera(deviceId);
    }
  };

  const handleAudioDeviceChange = async (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    await startMicrophone(deviceId);
  };

  // Initialize scenario
  useEffect(() => {
    if (!scenario) return;

    const generatedAgents = generateAgents(scenario);
    setAgents(generatedAgents);
    console.log(`[Setup] Generated ${generatedAgents.length} agents for ${scenario.id}:`);
    generatedAgents.forEach(agent => {
      console.log(`  - ${agent.name}: voiceId=${agent.voiceId}`);
    });
    
    if (scenario.id === 'presentation') {
      // Force enable TTS
      ttsService.setEnabled(true);
      setTtsEnabled(true);
      
      setTimeout(() => {
        const welcomeMessage = "Welcome everyone! Let me show you why starting to invest now will change your life. Just $100 a month at age 20 becomes 1.1 million dollars at retirement!";
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          agentId: "user",
          agentName: "You (Presenter)",
          content: welcomeMessage,
          timestamp: new Date(),
          isUser: true,
        };
        setMessages([userMessage]);
        console.log('[Setup] Presentation started. Q&A begins at 30 seconds.');
      }, 2000);
    } else {
      // Original behavior for other scenarios
      setTimeout(() => {
        const welcomeMessage = generatedAgents[0]?.emotionPrefix
          ? `${generatedAgents[0].emotionPrefix} Hello! Welcome to the session. Feel free to introduce yourself!`
          : "Hello! Welcome to the session. Feel free to introduce yourself!";
        if (generatedAgents[0]) {
          addAgentMessage(generatedAgents[0], welcomeMessage);
          setConvState((prev) =>
            advanceAfterAgentResponse(prev, generatedAgents[0].id)
          );
        }
      }, 2000);
    }
  }, [scenario]);

  const effectiveDuration = customDurationSec !== null ? customDurationSec : scenario?.duration ?? 0;

  // Timer
  useEffect(() => {
    if (!isActive || sessionEnded) return;
    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        if (scenario?.id === 'presentation' && (newTime === 10 || newTime === 20 || newTime === 25 || newTime === 30)) {
          console.log(`[Timer] ${newTime} seconds elapsed`);
        }
        if (effectiveDuration > 0 && newTime >= effectiveDuration) {
          handleEndSession();
        }
        return newTime;
      });
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [isActive, sessionEnded, effectiveDuration, scenario?.id]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addAgentMessage = (agent: Agent, content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      agentId: agent.id,
      agentName: agent.name,
      content,
      timestamp: new Date(),
      isUser: false,
    };
    setMessages((prev) => [...prev, newMessage]);

    // Queue TTS
    if (ttsService.isEnabled() || scenario?.id === 'presentation') {
      ttsService.queueSpeech({
        text: content,
        agentName: agent.name,
        messageId: newMessage.id,
        voiceId: agent.voiceId,
      });
    }
  };

  const scheduleAgentResponse = (stateSnapshot?: ReturnType<typeof initConversationState>) => {
    if (!scenario || agents.length === 0 || sessionEnded) return;
    const snapshot = stateSnapshot ?? convState;
    if (!canGenerateAgentResponse(snapshot)) return;
    if (scheduledTurnRef.current === snapshot.turnIndex) return;
    scheduledTurnRef.current = snapshot.turnIndex;

    const delay = getResponseDelay(difficulty);
    const selected = selectAgentToSpeak(messages, scenario, agents, "active-host");
    if (!selected) {
      scheduledTurnRef.current = null;
      return;
    }

    const timer = setTimeout(() => {
      if (sessionEnded) return;
      const current = convState;
      if (!canGenerateAgentResponse(current)) return;
      if (scheduledTurnRef.current !== current.turnIndex) return;

      const conversationHistory = messages.map((m) =>
        m.isUser ? `You: ${m.content}` : `${m.agentName}: ${m.content}`
      );
      const ctx: AgentPromptContext = {
        scenarioBasePrompt: scenario.basePrompt,
        userExtras: userExtrasForContext,
        talkingPoints: talkingPointsForContext,
        presentational: scenario.presentational,
      };
      const response = generateAgentResponse(
        scenario.type,
        selected,
        difficulty,
        conversationHistory,
        ctx
      );
      addAgentMessage(selected, response);
      setConvState((prev) => advanceAfterAgentResponse(prev, selected.id));
      scheduledTurnRef.current = null;
    }, delay);

    agentResponseTimers.current.push(timer);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      agentId: "user",
      agentName: "You",
      content: userInput,
      timestamp: new Date(),
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    
    console.log(`[handleSendMessage] Scenario: ${scenario?.id}, QA Started: ${!!qaStartTime}, Awaiting Response: ${awaitingUserResponse}, Question Index: ${currentQuestionIndex}`);
    
    // For presentation scenario during Q&A, trigger next question after user responds
    if (scenario?.id === 'presentation' && qaStartTime && awaitingUserResponse) {
      console.log('[handleSendMessage] Triggering next Q&A question after user response');
      setAwaitingUserResponse(false);
      askNextQuestion();
    } else if (scenario?.id !== 'presentation') {
      // Regular agent response logic for non-presentation scenarios
      console.log('[handleSendMessage] Non-presentation scenario, using regular agent response');
      setConvState((prev) => {
        const next = updateStateOnUserMessage(prev);
        if (agents.length > 0 && !sessionEnded) scheduleAgentResponse(next);
        return next;
      });
    } else {
      console.log('[handleSendMessage] Presentation but not in Q&A or not awaiting response');
    }
  };

  const handleEndSession = () => {
    setIsActive(false);
    setSessionEnded(true);
    agentResponseTimers.current.forEach((timer) => clearTimeout(timer));
    agentResponseTimers.current = [];
    if (qaTimerRef.current) {
      clearTimeout(qaTimerRef.current);
    }
    ttsService.stopAll();

    const userMessages = messages.filter((m) => m.isUser).length;
    const score = calculateScore(userMessages, timeElapsed, difficulty);
    setFinalScore(score);

    // Save session
    const sessions = JSON.parse(localStorage.getItem("practice-sessions") || "[]");
    sessions.push({
      scenarioId: scenario?.id,
      date: new Date().toISOString(),
      score,
      duration: timeElapsed,
      difficulty,
    });
    localStorage.setItem("practice-sessions", JSON.stringify(sessions));

    // Show voice analysis after a short delay
    setTimeout(() => {
      setShowVoiceAnalysis(true);
    }, 1500);

    // Clean up media
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get all flow sections
  const getAllSections = (): FlowSection[] => {
    if (!presentationFlow) return [];
    return [
      presentationFlow.intro,
      ...presentationFlow.sections,
      presentationFlow.conclusion,
      presentationFlow.qa
    ];
  };

  // Advance flow section
  const advanceToNextSection = () => {
    const allSections = getAllSections();
    const currentIndex = allSections.findIndex(s => s.id === currentFlowSection);
    if (currentIndex < allSections.length - 1) {
      setCurrentFlowSection(allSections[currentIndex + 1].id);
    }
  };

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Scenario not found</h1>
          <Button onClick={() => router.push("/scenarios")}>
            Back to Scenarios
          </Button>
        </div>
      </div>
    );
  }

  if (sessionEnded && showVoiceAnalysis) {
    return <VoiceAnalysis sessionId={scenario.id} scenarioTitle={scenario.title} duration={timeElapsed} />;
  }

  if (sessionEnded && !showVoiceAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
          <p className="text-gray-600 mb-6">
            Analyzing your voice performance...
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/scenarios")}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit
          </Button>
          <h1 className="text-white font-semibold">{scenario.title}</h1>
        </div>

        <div className="flex items-center space-x-6 text-gray-300 text-sm">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {scenario.id === 'presentation' ? (
              timeElapsed < 30 ? (
                <span className="text-yellow-400">
                  Q&A starts in {30 - timeElapsed}s
                </span>
              ) : (
                <span className="text-green-400">
                  Q&A Active ({formatTime(timeElapsed)})
                </span>
              )
            ) : (
              effectiveDuration > 0 ? (
                <>
                  {formatTime(Math.max(0, effectiveDuration - timeElapsed))} left
                </>
              ) : (
                <>Timer: {formatTime(timeElapsed)}</>
              )
            )}
          </div>
          {timeElapsed >= 30 && scenario.id === 'presentation' && (
            <div className="flex items-center px-3 py-1 bg-orange-700 rounded animate-pulse">
              <MessageSquare className="w-3 h-3 mr-1" />
              <span className="text-xs font-medium">Q&A Session Active</span>
            </div>
          )}
          <div className="flex items-center">
            <UsersIcon className="w-4 h-4 mr-2" />
            {agents.length} {scenario.id === 'presentation' ? 'students' : 'participants'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* User Video */}
          <div className="p-4">
            <div className="bg-gray-700 rounded-lg aspect-video mb-4 flex items-center justify-center relative overflow-hidden">
              {isVideoOn ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {cameraError && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center p-4">
                      <p className="text-red-400 text-xs text-center">{cameraError}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500">Video Off</div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {scenario.id === 'presentation' ? 'You (Presenter)' : 'You'}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <MicOff className="w-4 h-4 mr-2" />
                ) : (
                  <Mic className="w-4 h-4 mr-2" />
                )}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button
                variant={!isVideoOn ? "destructive" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? (
                  <Video className="w-4 h-4 mr-2" />
                ) : (
                  <VideoOff className="w-4 h-4 mr-2" />
                )}
                {isVideoOn ? "Stop Video" : "Start Video"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start"
                onClick={handleEndSession}
              >
                <Phone className="w-4 h-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>

          {/* Presentation Flow */}
          {scenario.id === 'presentation' && presentationFlow && (
            <div className="flex-1 p-4 border-t border-gray-700">
              <div className="flex items-center mb-3">
                <Presentation className="w-4 h-4 mr-2 text-gray-300" />
                <h3 className="text-white text-sm font-semibold">Presentation Flow</h3>
              </div>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <div className="space-y-2">
                  {getAllSections().map((section, index) => {
                    const isActive = section.id === currentFlowSection;
                    const isPassed = getAllSections().findIndex(s => s.id === currentFlowSection) > index;
                    
                    return (
                      <Card 
                        key={section.id}
                        className={`cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-blue-900 border-blue-600' 
                            : isPassed
                            ? 'bg-gray-700 opacity-60'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        onClick={() => setCurrentFlowSection(section.id)}
                      >
                        <CardHeader className="py-2 px-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-xs ${isActive ? 'text-white' : 'text-gray-300'}`}>
                              {section.title}
                            </CardTitle>
                            {isActive && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                            {isPassed && !isActive && (
                              <Check className="w-3 h-3 text-green-500" />
                            )}
                          </div>
                        </CardHeader>
                        {isActive && (
                          <CardContent className="py-2 px-3">
                            <ul className="text-xs text-gray-300 space-y-1">
                              {section.goals.map((goal, idx) => (
                                <li key={idx} className="flex items-start">
                                  <ChevronRight className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                  <span>{goal}</span>
                                </li>
                              ))}
                            </ul>
                            {index < getAllSections().length - 1 && (
                              <Button
                                size="sm"
                                variant="default"
                                className="w-full mt-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  advanceToNextSection();
                                }}
                              >
                                Next Section
                              </Button>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {micError && (
            <div className="p-4">
              <div className="p-2 bg-red-900 bg-opacity-50 rounded text-xs text-red-300">
                {micError}
              </div>
            </div>
          )}
        </div>

        {/* Center - Agent Videos */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-gray-700 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                  <div className="text-white text-6xl">{agent.avatar}</div>
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {agent.name}
                </div>
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {scenario.id === 'presentation' ? 'Student' : agent.personality}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Transcript */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white font-semibold">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${message.isUser ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block max-w-[80%] rounded-lg p-3 ${
                    message.isUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <div className="font-semibold text-xs mb-1">
                    {message.agentName}
                  </div>
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-700">
            {/* Show interim transcript during speech recognition */}
            {interimTranscript && scenario?.id === 'presentation' && (
              <div className="mb-2 p-2 bg-blue-900 bg-opacity-50 rounded text-xs text-blue-200">
                <span className="text-blue-400">Listening:</span> {interimTranscript}
              </div>
            )}
            
            {/* Show speech recognition status for presentation */}
            {scenario?.id === 'presentation' && qaStartTime && (
              <div className="mb-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {isListening ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400">Voice recognition active - speak your answer</span>
                    </>
                  ) : awaitingUserResponse ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-yellow-400">Waiting for your response...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      <span className="text-gray-400">Processing...</span>
                    </>
                  )}
                </div>
                {speechError && (
                  <span className="text-red-400 text-xs">{speechError}</span>
                )}
              </div>
            )}
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={scenario?.id === 'presentation' && qaStartTime ? "Speak or type your answer..." : "Type your message..."}
                disabled={isMuted}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userInput.trim() || isMuted}
                size="sm"
              >
                Send
              </Button>
            </div>
            {isMuted && (
              <p className="text-xs text-yellow-500 mt-2">
                Unmute to speak or type messages
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Session Settings</DialogTitle>
            <DialogDescription>
              Customize your practice session preferences
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-6 mt-4">
              {/* Session Settings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Session Settings
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Difficulty Level
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Controls how frequently AI agents respond
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      {(["easy", "medium", "hard"] as DifficultyLevel[]).map(
                        (level) => (
                          <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`px-4 py-3 rounded-lg border transition-colors ${
                              difficulty === level
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-medium capitalize">
                                {level}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                {level === "easy" && "~8s delay"}
                                {level === "medium" && "~5s delay"}
                                {level === "hard" && "~3s delay"}
                              </span>
                              {difficulty === level && (
                                <Check className="w-4 h-4 text-blue-600 mt-1" />
                              )}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* TTS Settings */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Text-to-Speech Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="tts-enabled"
                        className="text-sm font-medium"
                      >
                        Enable TTS for Agent Messages
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        AI agents will speak their messages
                        {scenario.id === 'presentation' && ' (Always on for presentations)'}
                      </p>
                    </div>
                    <Switch
                      id="tts-enabled"
                      checked={scenario.id === 'presentation' ? true : ttsEnabled}
                      onCheckedChange={scenario.id === 'presentation' ? undefined : setTtsEnabled}
                      disabled={scenario.id === 'presentation'}
                    />
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Audio Settings
                </h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Microphone Source
                  </label>
                  <div className="space-y-2">
                    {audioDevices.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                        No microphones detected
                      </p>
                    ) : (
                      audioDevices.map((device) => (
                        <button
                          key={device.deviceId}
                          onClick={() => handleAudioDeviceChange(device.deviceId)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                            selectedAudioDeviceId === device.deviceId
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {device.label}
                            </span>
                            {selectedAudioDeviceId === device.deviceId && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Video Settings */}
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Video Settings
                </h3>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Camera Source
                  </label>
                  <div className="space-y-2">
                    {videoDevices.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 rounded-lg">
                        No cameras detected
                      </p>
                    ) : (
                      videoDevices.map((device) => (
                        <button
                          key={device.deviceId}
                          onClick={() => handleVideoDeviceChange(device.deviceId)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                            selectedVideoDeviceId === device.deviceId
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {device.label}
                            </span>
                            {selectedVideoDeviceId === device.deviceId && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t flex-shrink-0">
            <Button onClick={() => setShowSettings(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}