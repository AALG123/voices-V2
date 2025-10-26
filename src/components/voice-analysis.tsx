"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, Download, Share2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatedTitle } from "@/components/animated-title";

interface VoiceAnalysisData {
  overallScore: number;
  fluencyAnalysis: {
    stutters: { count: number; grade: string };
    fillerWords: { count: number; grade: string };
    repetitions: { count: number; grade: string };
  };
  speechPace: {
    wordsPerMinute: number;
    grade: string;
    speakingTime: string;
    pauseTime: string;
    idealRange: string;
  };
  voiceQuality: {
    clarity: number;
    volumeConsistency: number;
    pitchConsistency: number;
  };
  areasForImprovement: string[];
}

// Generate realistic-looking random scores with non-extreme values
const generateVoiceAnalysis = (): VoiceAnalysisData => {
  // Overall score between 68-88 (avoiding extremes)
  const overallScore = Math.floor(Math.random() * 20) + 68;
  
  // Fluency scores - realistic middle-range values
  const stutters = Math.floor(Math.random() * 4) + 2; // 2-5 stutters
  const fillerWords = Math.floor(Math.random() * 2) + 1; // 1-2 filler words (never 0)
  const repetitions = Math.floor(Math.random() * 5) + 5; // 5-9 repetitions
  
  // Speech pace - realistic speaking range
  const wpm = Math.floor(Math.random() * 30) + 95; // 95-125 wpm (avoiding extremes)
  const speakingTimeSeconds = Math.floor(Math.random() * 20) + 40; // 40-60 seconds
  const pauseTimeSeconds = Math.floor(Math.random() * 5) + 3; // 3-8 seconds
  
  // Voice quality percentages - realistic middle-high range
  const clarity = Math.floor(Math.random() * 12) + 82; // 82-94% (avoiding perfect scores)
  const volumeConsistency = Math.floor(Math.random() * 15) + 78; // 78-93%
  const pitchConsistency = Math.floor(Math.random() * 15) + 77; // 77-92%
  
  // Grade calculation
  const getGrade = (value: number, thresholds: number[]) => {
    if (value <= thresholds[0]) return "A";
    if (value <= thresholds[1]) return "B";
    if (value <= thresholds[2]) return "C";
    return "D";
  };
  
  const getPaceGrade = (wpm: number) => {
    if (wpm >= 120 && wpm <= 150) return "A";
    if (wpm >= 100 && wpm < 120) return "B";
    if (wpm >= 80 && wpm < 100) return "C";
    return "D";
  };
  
  // Generate improvement suggestions based on scores
  const improvements: string[] = [];
  if (stutters > 3) {
    improvements.push("Reduce stuttering by speaking more slowly and taking deep breaths before starting.");
  }
  if (wpm < 100 || wpm > 150) {
    improvements.push("Increase your speaking pace slightly to maintain audience engagement.");
  }
  if (fillerWords > 0) {
    improvements.push("Minimize filler words like 'um' and 'uh' by pausing instead when thinking.");
  }
  if (clarity < 90) {
    improvements.push("Improve clarity by articulating words more precisely.");
  }
  if (volumeConsistency < 85) {
    improvements.push("Maintain consistent volume throughout your speech.");
  }
  if (pitchConsistency < 85) {
    improvements.push("Vary your pitch more to keep the audience engaged.");
  }
  
  // Ensure at least 2 improvements
  if (improvements.length === 0) {
    improvements.push("Continue practicing to maintain your excellent speaking skills.");
    improvements.push("Try speaking in front of larger audiences to build confidence.");
  }
  
  return {
    overallScore,
    fluencyAnalysis: {
      stutters: { count: stutters, grade: getGrade(stutters, [2, 5, 8]) },
      fillerWords: { count: fillerWords, grade: getGrade(fillerWords, [0, 2, 4]) },
      repetitions: { count: repetitions, grade: "C" } // Fixed as shown in screenshot
    },
    speechPace: {
      wordsPerMinute: wpm,
      grade: getPaceGrade(wpm),
      speakingTime: `0:${speakingTimeSeconds.toString().padStart(2, '0')}`,
      pauseTime: `0:${pauseTimeSeconds.toString().padStart(2, '0')}`,
      idealRange: "120-150 wpm"
    },
    voiceQuality: {
      clarity,
      volumeConsistency,
      pitchConsistency
    },
    areasForImprovement: improvements.slice(0, 2) // Take only 2 suggestions
  };
};

interface VoiceAnalysisProps {
  sessionId?: string;
  scenarioTitle?: string;
  duration?: number;
}

export function VoiceAnalysis({ sessionId, scenarioTitle = "Practice Session", duration = 60 }: VoiceAnalysisProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<VoiceAnalysisData | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  
  useEffect(() => {
    // Simulate analysis generation
    setTimeout(() => {
      setAnalysis(generateVoiceAnalysis());
      setIsGenerating(false);
    }, 2000);
  }, []);
  
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-300">Analyzing your voice performance...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!analysis) return null;
  
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-400";
      case "B": return "text-blue-400";
      case "C": return "text-yellow-400";
      case "D": return "text-red-400";
      default: return "text-gray-400";
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 75) return "text-blue-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };
  
  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30 z-0"
      >
        <source src="/assets/animated-backdrop.webm" type="video/webm" />
      </video>
      
      {/* Overlay to darken video */}
      <div className="absolute inset-0 bg-gray-900/70 z-0"></div>
      
      {/* Content */}
      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
        {/* Animated Title */}
        <div className="text-center mb-8">
          <AnimatedTitle
            text="Your Performance Analysis"
            className="font-inter text-4xl md:text-5xl font-bold text-white mb-3 leading-tight"
          />
          <p className="text-lg text-gray-400">
            Comprehensive breakdown of your speaking performance
          </p>
        </div>

        {/* Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Overall Score</h2>
              <p className="text-gray-400 mt-1">Your confidence rating for this session</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <div className="text-sm text-gray-400">/100</div>
            </div>
          </div>
          
          {/* Overall Score Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Overall Confidence Score</span>
            </div>
            <Progress value={analysis.overallScore} className="h-3" />
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Fluency Analysis */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center text-white">
                <FileText className="w-5 h-5 mr-2" />
                Fluency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Stutters</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-200">{analysis.fluencyAnalysis.stutters.count}</span>
                  <span className={`font-bold ${getGradeColor(analysis.fluencyAnalysis.stutters.grade)}`}>
                    {analysis.fluencyAnalysis.stutters.grade}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Filler Words</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-200">{analysis.fluencyAnalysis.fillerWords.count}</span>
                  <span className={`font-bold ${getGradeColor(analysis.fluencyAnalysis.fillerWords.grade)}`}>
                    {analysis.fluencyAnalysis.fillerWords.grade}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Repetitions</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-200">{analysis.fluencyAnalysis.repetitions.count}</span>
                  <span className={`font-bold ${getGradeColor(analysis.fluencyAnalysis.repetitions.grade)}`}>
                    {analysis.fluencyAnalysis.repetitions.grade}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Speech Pace */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center text-white">
                <Clock className="w-5 h-5 mr-2" />
                Speech Pace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Words/Minute</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-200">{analysis.speechPace.wordsPerMinute}</span>
                  <span className={`font-bold ${getGradeColor(analysis.speechPace.grade)}`}>
                    {analysis.speechPace.grade}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Speaking Time</span>
                <span className="font-semibold text-gray-200">{analysis.speechPace.speakingTime}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pause Time</span>
                <span className="font-semibold text-gray-200">{analysis.speechPace.pauseTime}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-500">Ideal: {analysis.speechPace.idealRange}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Voice Quality */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center text-white">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Voice Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Clarity</span>
                  <span className="text-sm font-semibold text-gray-200">{analysis.voiceQuality.clarity}%</span>
                </div>
                <Progress value={analysis.voiceQuality.clarity} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Volume Consistency</span>
                  <span className="text-sm font-semibold text-gray-200">{analysis.voiceQuality.volumeConsistency}%</span>
                </div>
                <Progress value={analysis.voiceQuality.volumeConsistency} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-400">Pitch Consistency</span>
                  <span className="text-sm font-semibold text-gray-200">{analysis.voiceQuality.pitchConsistency}%</span>
                </div>
                <Progress value={analysis.voiceQuality.pitchConsistency} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Areas for Improvement */}
        <Card className="mt-6 bg-gray-800 border-gray-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.areasForImprovement.map((improvement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-1">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <p className="text-sm text-gray-300">{improvement}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => router.push('/scenarios')}
          >
            Practice Again
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              // In a real app, this would generate a PDF report
              alert('Report download feature coming soon!');
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              // In a real app, this would share the results
              alert('Share feature coming soon!');
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>
        </div>

        {/* Performance Graph Mockup */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-white">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Your Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 bg-gray-900 rounded-lg p-6 overflow-hidden">
              {/* Grid lines */}
              <div className="absolute inset-0 p-6">
                <div className="h-full w-full relative">
                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-gray-700"
                      style={{ top: `${i * 25}%` }}
                    />
                  ))}
                  {/* Vertical grid lines */}
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="absolute h-full border-l border-gray-700"
                      style={{ left: `${i * 16.66}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-between text-xs text-gray-500">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              {/* Performance line chart */}
              <svg className="absolute inset-0 w-full h-full p-6" viewBox="0 0 600 240" preserveAspectRatio="none">
                {/* Area under the curve */}
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 50 180 L 150 160 L 250 140 L 350 110 L 450 80 L 550 50 L 550 240 L 50 240 Z"
                  fill="url(#areaGradient)"
                />
                
                {/* Line */}
                <path
                  d="M 50 180 L 150 160 L 250 140 L 350 110 L 450 80 L 550 50"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data points */}
                {[
                  { x: 50, y: 180 },
                  { x: 150, y: 160 },
                  { x: 250, y: 140 },
                  { x: 350, y: 110 },
                  { x: 450, y: 80 },
                  { x: 550, y: 50 },
                ].map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="#3b82f6"
                    stroke="#1e40af"
                    strokeWidth="2"
                  />
                ))}
              </svg>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-6 right-6 flex justify-between text-xs text-gray-500 pb-2">
                <span>Session 1</span>
                <span>Session 2</span>
                <span>Session 3</span>
                <span>Session 4</span>
                <span>Session 5</span>
                <span>Session 6</span>
              </div>

              {/* Current session indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>Latest Session</span>
              </div>
            </div>

            {/* Stats below graph */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-green-400">+23%</div>
                <div className="text-xs text-gray-400 mt-1">Improvement</div>
              </div>
              <div className="text-center p-4 bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">6</div>
                <div className="text-xs text-gray-400 mt-1">Total Sessions</div>
              </div>
              <div className="text-center p-4 bg-gray-900 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">85</div>
                <div className="text-xs text-gray-400 mt-1">Avg Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default VoiceAnalysis;