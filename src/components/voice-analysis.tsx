"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, Download, Share2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

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

// Generate realistic-looking random scores
const generateVoiceAnalysis = (): VoiceAnalysisData => {
  // Overall score between 65-95
  const overallScore = Math.floor(Math.random() * 30) + 65;
  
  // Fluency scores - lower is better
  const stutters = Math.floor(Math.random() * 8);
  const fillerWords = Math.floor(Math.random() * 3);
  const repetitions = Math.floor(Math.random() * 10) + 3;
  
  // Speech pace
  const wpm = Math.floor(Math.random() * 50) + 80; // 80-130 wpm
  const speakingTimeSeconds = Math.floor(Math.random() * 30) + 30;
  const pauseTimeSeconds = Math.floor(Math.random() * 10);
  
  // Voice quality percentages
  const clarity = Math.floor(Math.random() * 15) + 85; // 85-100%
  const volumeConsistency = Math.floor(Math.random() * 20) + 75; // 75-95%
  const pitchConsistency = Math.floor(Math.random() * 20) + 75; // 75-95%
  
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Analyzing your voice performance...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!analysis) return null;
  
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-green-600";
      case "B": return "text-blue-600";
      case "C": return "text-yellow-600";
      case "D": return "text-red-600";
      default: return "text-gray-600";
    }
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Voice Analysis Summary</h1>
              <p className="text-gray-600 mt-1">Comprehensive analysis of your speaking performance</p>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <div className="text-sm text-gray-600">/100</div>
            </div>
          </div>
          
          {/* Overall Score Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Confidence Score</span>
            </div>
            <Progress value={analysis.overallScore} className="h-3" />
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Fluency Analysis */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Fluency Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Stutters</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{analysis.fluencyAnalysis.stutters.count}</span>
                  <span className={`font-bold ${getGradeColor(analysis.fluencyAnalysis.stutters.grade)}`}>
                    {analysis.fluencyAnalysis.stutters.grade}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Filler Words</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{analysis.fluencyAnalysis.fillerWords.count}</span>
                  <span className={`font-bold ${getGradeColor(analysis.fluencyAnalysis.fillerWords.grade)}`}>
                    {analysis.fluencyAnalysis.fillerWords.grade}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Repetitions</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{analysis.fluencyAnalysis.repetitions.count}</span>
                  <span className={`font-bold ${getGradeColor(analysis.fluencyAnalysis.repetitions.grade)}`}>
                    {analysis.fluencyAnalysis.repetitions.grade}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Speech Pace */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Speech Pace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Words/Minute</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{analysis.speechPace.wordsPerMinute}</span>
                  <span className={`font-bold ${getGradeColor(analysis.speechPace.grade)}`}>
                    {analysis.speechPace.grade}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Speaking Time</span>
                <span className="font-semibold">{analysis.speechPace.speakingTime}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pause Time</span>
                <span className="font-semibold">{analysis.speechPace.pauseTime}</span>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">Ideal: {analysis.speechPace.idealRange}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Voice Quality */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
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
                  <span className="text-sm text-gray-600">Clarity</span>
                  <span className="text-sm font-semibold">{analysis.voiceQuality.clarity}%</span>
                </div>
                <Progress value={analysis.voiceQuality.clarity} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Volume Consistency</span>
                  <span className="text-sm font-semibold">{analysis.voiceQuality.volumeConsistency}%</span>
                </div>
                <Progress value={analysis.voiceQuality.volumeConsistency} className="h-2" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Pitch Consistency</span>
                  <span className="text-sm font-semibold">{analysis.voiceQuality.pitchConsistency}%</span>
                </div>
                <Progress value={analysis.voiceQuality.pitchConsistency} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Areas for Improvement */}
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center">
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
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-700">{improvement}</p>
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
      </div>
    </div>
  );
}

export default VoiceAnalysis;