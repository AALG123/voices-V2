"use client";

import { use } from "react";
import VoiceAnalysis from "@/components/voice-analysis";
import { getScenarioById } from "@/lib/scenarios";

interface VoiceAnalysisPageProps {
  params: Promise<{ scenarioId: string }>;
}

export default function VoiceAnalysisPage({ params }: VoiceAnalysisPageProps) {
  const resolvedParams = use(params);
  const scenario = getScenarioById(resolvedParams.scenarioId);
  
  return (
    <VoiceAnalysis 
      sessionId={resolvedParams.scenarioId}
      scenarioTitle={scenario?.title}
    />
  );
}