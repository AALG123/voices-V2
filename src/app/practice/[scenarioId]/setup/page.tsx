"use client";

import { use, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Users, FileText, Image, Presentation, ChevronUp, ChevronDown, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { getScenarioById } from "@/lib/scenarios";
import type { PresentationalFlow, FlowSection } from "@/types";
import { Slider } from "@/components/ui/slider";
import { IntroFade } from "@/components/IntroFade";

function SectionEditor({ section, onChange }: { section: FlowSection; onChange: (next: FlowSection) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-gray-400">Title</Label>
        <Input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Section title"
          className="mt-1 bg-gray-950 text-white border-gray-600"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs text-gray-400">Goals</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...section, goals: [...section.goals, "New goal"] })}
          >
            <Plus className="w-4 h-4 mr-2" /> Add goal
          </Button>
        </div>
        <div className="mt-2 space-y-2">
          {section.goals.map((g, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => {
                    if (idx === 0) return;
                    const next = [...section.goals];
                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                    onChange({ ...section, goals: next });
                  }}
                  disabled={idx === 0}
                  aria-label="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => {
                    if (idx === section.goals.length - 1) return;
                    const next = [...section.goals];
                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                    onChange({ ...section, goals: next });
                  }}
                  disabled={idx === section.goals.length - 1}
                  aria-label="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <Input
                  value={g}
                  onChange={(e) => {
                    const next = [...section.goals];
                    next[idx] = e.target.value;
                    onChange({ ...section, goals: next });
                  }}
                  placeholder={`Goal ${idx + 1}`}
                  className="bg-gray-950 text-white border-gray-600"
                />
              </div>
              <div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Delete goal"
                  onClick={() => {
                    const next = section.goals.filter((_, i) => i !== idx);
                    onChange({ ...section, goals: next });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {section.goals.length === 0 && (
            <div className="text-xs text-gray-400">No goals yet. Add one to get started.</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SetupPageProps {
  params: Promise<{ scenarioId: string }>;
}

export default function SetupPage({ params }: SetupPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const scenario = getScenarioById(resolvedParams.scenarioId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extraDetails, setExtraDetails] = useState<string>("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(() => {
    const s = scenario?.duration ?? 0;
    return Math.max(0, Math.floor(s / 60));
  });

  const [customDurationSec, setCustomDurationSec] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<
    | { text: string; meta: { pages: number; chars: number; fileType?: string; processedBy?: string } }
    | null
  >(null);

  type TalkingPoint = { id: string; text: string; importance: number };
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[] | null>(null);
  const [tpLoading, setTpLoading] = useState<boolean>(false);
  const [tpError, setTpError] = useState<string | null>(null);
  const [tpEdited, setTpEdited] = useState<boolean>(false);
  const [tpSavedAt, setTpSavedAt] = useState<number | null>(null);

  const [flow, setFlow] = useState<PresentationalFlow | null>(null);
  const [flowLoading, setFlowLoading] = useState<boolean>(false);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowEdited, setFlowEdited] = useState<boolean>(false);
  const [flowSavedAt, setFlowSavedAt] = useState<number | null>(null);

  const handleFileChange = async (file: File | null) => {
    setSelectedFile(file);
    setExtracted(null);
    setExtractionError(null);

    if (!file) return;

    // Check if this is the presentation scenario - use hardcoded demo data
    if (scenario?.id === 'presentation') {
      setIsExtracting(true);
      
      // Simulate processing delay - CHANGE THIS NUMBER FOR DELAY IN MILLISECONDS
      setTimeout(() => {
        // Hardcoded investment document content from the PDF
        const hardcodedText = `Investing on One Page — 2025 Quickstart
A concise, non-advisory checklist to build a low-cost, diversified portfolio you can stick with.

Core Principles:
- Pay yourself first: automate contributions each payday
- Diversify broadly; avoid concentrated bets
- Time in the market > timing the market
- Keep costs low (favor broad index funds/ETFs)
- Be tax-smart (use tax-advantaged accounts first)
- Rebalance on a schedule; ignore short-term noise

Step-by-Step Plan:
1. Emergency fund: Save 3–6 months of expenses in a high-yield savings account
2. Kill high-interest debt: Pay off >8–10% APR debt before investing
3. Choose accounts: 401(k)/403(b) up to match → HSA (if eligible) → IRA (Roth or Traditional) → taxable brokerage
4. Pick allocation by risk: Conservative 60/40, Balanced 70/30, Aggressive 90/10 (stocks/bonds)
5. Fund selection: Prefer total-market index funds/ETFs (US + International) and investment-grade bond funds
6. Automate & rebalance: Contribute each payday; rebalance yearly or when drift exceeds ±5%

Simple Model Portfolios (Examples, not advice):
- Conservative (60/40): US Stocks 35%, Intl Stocks 25%, Bonds 40%
- Balanced (70/30): US Stocks 50%, Intl Stocks 20%, Bonds 30%
- Aggressive (90/10): US Stocks 65%, Intl Stocks 25%, Bonds 10%

Costs & Taxes:
- Target <0.10–0.20% expense ratios for stock index funds; <0.10% for broad bond funds
- Asset location: hold bonds/REITs in tax-advantaged accounts when possible
- Prefer long-term holding (≥1 year) for favorable capital gains rates

How Much & What to Expect:
Rule of thumb: invest ~15% of gross income for retirement (20%+ if starting later)
Expect volatility: stocks may decline 30–50% at times
Long-run real returns have historically averaged ~4–8% for stocks and ~0–3% for bonds—never guaranteed

Common Pitfalls:
- Chasing recent winners or headlines
- Frequent trading/market-timing
- Ignoring fees and taxes
- Overconcentration (single stocks/crypto/sector)
- Using leverage without a plan
- Not having an Investment Policy Statement (IPS)

5-Minute Starter Example:
Open a low-cost brokerage. In a retirement account, buy: 50% US Total-Market index fund/ETF, 20% International Total-Market, 30% US Investment-Grade Bonds. Automate contributions each payday; rebalance each January.`;

        setExtracted({
          text: hardcodedText,
          meta: {
            pages: 2,
            chars: hardcodedText.length,
            fileType: 'pdf',
            processedBy: 'gemini-2.0-flash-exp'
          }
        });

        // Auto-fill extra details after a short delay
        setTimeout(() => {
          const hardcodedDetails = `Presenting to: Finance 101 undergraduate students at UC Berkeley
Topic: Personal investing fundamentals for beginners
Duration: 15-minute presentation with Q&A
Goal: Educate students on basic investment principles and help them start their investment journey
Key focus areas: Index fund investing, portfolio diversification, and tax-advantaged accounts`;
          
          setExtraDetails(hardcodedDetails);
        }, 500);

        setIsExtracting(false);
      }, 5000); // 5-second delay to simulate processing (5000 milliseconds = 5 seconds)
    } else {
      // Original API call for other scenarios
      try {
        setIsExtracting(true);
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/extract-text", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setExtractionError(data?.error || "Failed to extract text");
          return;
        }
        setExtracted(data);
      } catch (err) {
        setExtractionError("Network error while extracting text");
      } finally {
        setIsExtracting(false);
      }
    }
  };

  const composedPrompt = useMemo(() => `${scenario?.basePrompt ?? ''}${
    extraDetails.trim() ? `\n\nExtra details from user:\n${extraDetails.trim()}` : ''
  }${
    extracted ? `\n\nDocument content:\n${extracted.text.slice(0, 2000)}${extracted.text.length > 2000 ? '...' : ''}` : ''
  }`, [scenario?.basePrompt, extraDetails, extracted]);

  const canAddMorePoints = (talkingPoints?.length ?? 0) < 15;

  const generateTalkingPoints = async (opts?: { force?: boolean }) => {
    if (!scenario) return;
    
    // For presentation scenario, use hardcoded talking points
    if (scenario.id === 'presentation') {
      setTpLoading(true);
      setTpError(null);
      
      // Simulate loading delay
      setTimeout(() => {
        const hardcodedTalkingPoints: TalkingPoint[] = [
          { id: crypto.randomUUID(), text: "What's the difference between a 401(k) and an IRA?", importance: 5 },
          { id: crypto.randomUUID(), text: "How much money do I need to start investing?", importance: 5 },
          { id: crypto.randomUUID(), text: "Can you explain what expense ratios are and why they matter?", importance: 4 },
          { id: crypto.randomUUID(), text: "What does it mean to diversify your portfolio?", importance: 5 },
          { id: crypto.randomUUID(), text: "Should college students prioritize paying off student loans or investing?", importance: 4 },
          { id: crypto.randomUUID(), text: "What's the advantage of index funds over picking individual stocks?", importance: 5 },
          { id: crypto.randomUUID(), text: "How do I actually open a brokerage account?", importance: 3 },
          { id: crypto.randomUUID(), text: "What happens if the stock market crashes right after I invest?", importance: 4 },
          { id: crypto.randomUUID(), text: "Is cryptocurrency a good investment for beginners?", importance: 3 },
          { id: crypto.randomUUID(), text: "How often should I check my investment account?", importance: 3 },
          { id: crypto.randomUUID(), text: "What's the benefit of starting to invest while still in college?", importance: 4 },
          { id: crypto.randomUUID(), text: "Can you explain dollar-cost averaging?", importance: 3 }
        ];
        
        setTalkingPoints(hardcodedTalkingPoints);
        setTpEdited(false);
        setTpLoading(false);
      }, 1500);
      
      return;
    }
    
    // Original API call for other scenarios
    if (tpEdited && !opts?.force) return;
    try {
      setTpLoading(true);
      setTpError(null);
      setTpSavedAt(null);
      const res = await fetch("/api/analyze/talking-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: composedPrompt,
          presentational: scenario.presentational,
          countMin: 8,
          countMax: 15,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTpError(data?.error || "Failed to generate talking points");
        return;
      }
      setTalkingPoints(data.points || []);
      setTpEdited(false);
    } catch (e) {
      setTpError("Network error while generating talking points");
    } finally {
      setTpLoading(false);
    }
  };

  const generateFlow = async (opts?: { force?: boolean }) => {
    if (!scenario?.presentational) return;
    
    // For presentation scenario, use hardcoded flow
    if (scenario.id === 'presentation') {
      setFlowLoading(true);
      setFlowError(null);
      
      // Simulate loading delay
      setTimeout(() => {
        const hardcodedFlow: PresentationalFlow = {
          intro: {
            id: crypto.randomUUID(),
            title: "Opening: Why Start Now",
            goals: [
              "I want to show you that $100/month at age 20 becomes $1.1 million at 65",
              "I want to share three simple steps you can take today"
            ]
          },
          sections: [
            {
              id: crypto.randomUUID(),
              title: "The Only Three Things You Need",
              goals: [
                "I want you to know: 1) Open a Roth IRA, 2) Buy index funds (VTI), 3) Automate $50/month",
                "I want to explain that index funds give you instant diversification with 0.04% fees"
              ]
            },
            {
              id: crypto.randomUUID(),
              title: "Start Today, Not Tomorrow",
              goals: [
                "I want to tell you that waiting 10 years costs you half your retirement money",
                "I want you to download Vanguard app right now and open an account - it takes 5 minutes"
              ]
            }
          ],
          conclusion: {
            id: crypto.randomUUID(),
            title: "Your Action Item",
            goals: [
              "I want you to commit: Open a Roth IRA tonight and invest your first dollar"
            ]
          },
          qa: {
            id: crypto.randomUUID(),
            title: "Your Questions",
            goals: [
              "I want to answer all your questions about getting started"
            ]
          }
        };
        
        setFlow(hardcodedFlow);
        setFlowEdited(false);
        setFlowLoading(false);
      }, 2000);
      
      return;
    }
    
    // Original API call for other scenarios
    if (flowEdited && !opts?.force) return;
    try {
      setFlowLoading(true);
      setFlowError(null);
      setFlowSavedAt(null);
      const res = await fetch("/api/analyze/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: composedPrompt,
          presentational: scenario.presentational,
          sectionsMin: 2,
          sectionsMax: 4,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFlowError(data?.error || "Failed to generate flow");
        return;
      }
      setFlow(data.flow || null);
      setFlowEdited(false);
    } catch (e) {
      setFlowError("Network error while generating flow");
    } finally {
      setFlowLoading(false);
    }
  };

  // Load custom time limit from setup
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
      // Ignore malformed config
    }
  }, [scenario]);

  // Load agent prompt context from setup
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
        // Don't load from localStorage for presentation scenario
        if (scenario.id !== 'presentation') {
          setExtraDetails(parsed?.userExtras || "");
          setTalkingPoints(
            parsed?.talkingPoints 
              ? parsed.talkingPoints.map(p => ({ ...p, id: crypto.randomUUID() }))
              : null
          );
          setExtracted(parsed?.extractedText ? {
            text: parsed.extractedText,
            meta: parsed.extractedMeta || { pages: 1, chars: parsed.extractedText.length }
          } : null);
        }
        localStorage.removeItem(ctxKey);
      }
    } catch {
      // ignore malformed context
    }
  }, [scenario]);

  // Auto-generate after extraction completes
  useEffect(() => {
    if (extracted && !tpEdited && !talkingPoints && !tpLoading) {
      void generateTalkingPoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracted]);

  // Auto-generate flow for presentational scenarios after extraction completes
  useEffect(() => {
    if (scenario?.presentational && extracted && !flowEdited && !flow && !flowLoading) {
      void generateFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracted, scenario?.presentational]);

  // For presentation scenario, also auto-generate on page load
  useEffect(() => {
    if (scenario?.presentational && scenario.id === 'presentation' && !flow && !flowLoading) {
      void generateFlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.presentational]);

  const getFileIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    
    if (type === "application/pdf" || name.endsWith('.pdf')) {
      return <FileText className="w-4 h-4" />;
    } else if (type.includes("presentation") || name.endsWith('.pptx')) {
      return <Presentation className="w-4 h-4" />;
    } else if (type.startsWith("image/")) {
      return <Image className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Scenario not found</h1>
          <Button onClick={() => router.push("/scenarios")}>Back to Scenarios</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-black overflow-hidden relative">
      
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      >
        <source src="/assets/animated-backdrop.webm" type="video/mp4" />
      </video>

      {/* Overlay to darken video */}
      <div className="absolute inset-0 bg-slate-900/50"></div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/scenarios">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Scenarios
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Setup: {scenario.title}</h1>
          <p className="text-gray-400">Configure your session before starting practice</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Context and Preferences</CardTitle>
              <CardDescription className="text-gray-400">
                Upload optional material, add extra details, and set a time limit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document upload */}
              <div>
                <Label htmlFor="material" className="block mb-2 text-gray-300">
                  Upload material (PDF, PPTX, Images, or Text)
                </Label>
                <Input
                  id="material"
                  type="file"
                  accept=".pdf,.pptx,.ppt,.txt,.md,.csv,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/*,image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  className="bg-gray-950 text-white border-gray-600 file:text-gray-300"
                />
                {selectedFile && (
                  <div className="text-sm text-gray-400 mt-2 flex items-center">
                    {getFileIcon(selectedFile)}
                    <span className="ml-2">
                      <span className="font-medium">{selectedFile.name}</span> ({Math.ceil(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                )}
                {isExtracting && (
                  <p className="text-xs text-gray-400 mt-2">Processing document with Gemini AI…</p>
                )}
                {extractionError && (
                  <p className="text-xs text-red-600 mt-2">{extractionError}</p>
                )}
                {!isExtracting && extracted && (
                  <div className="mt-4 border border-gray-600 rounded-md p-3 bg-gray-900">
                    <div className="text-sm font-medium mb-1 text-white">Extraction Summary</div>
                    <div className="text-xs text-gray-400 mb-2 space-y-1">
                      <div>Type: <span className="font-semibold capitalize">{extracted.meta.fileType || 'document'}</span></div>
                      <div>Characters: <span className="font-semibold">{extracted.meta.chars.toLocaleString()}</span></div>
                      {extracted.meta.pages > 1 && (
                        <div>Est. Pages: <span className="font-semibold">{extracted.meta.pages}</span></div>
                      )}
                      {extracted.meta.processedBy && (
                        <div className="text-xs text-blue-600">Powered by Gemini AI</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Preview (first 800 chars)</div>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-auto bg-gray-950 border border-gray-700 rounded p-2">
                        {extracted.text.slice(0, 800)}
                        {extracted.meta.chars > 800 ? "…" : ""}
                      </div>
                    </div>
                  </div>
                )}
                {!selectedFile && (
                  <div className="text-xs text-gray-400 mt-2 space-y-1">
                    <p>Optional: Upload any document for AI-powered text extraction</p>
                    <p className="text-blue-600">✨ Now supports: PDF, PowerPoint, Images, and Text files with Gemini AI</p>
                  </div>
                )}
              </div>

              {/* Extra scenario details */}
              <div>
                <Label htmlFor="details" className="block mb-2 text-gray-300">
                  Extra scenario details (optional)
                </Label>
                <Textarea
                  id="details"
                  placeholder="Add specifics (e.g., audience, goals, constraints)..."
                  value={extraDetails}
                  onChange={(e) => setExtraDetails(e.target.value)}
                  className="min-h-[120px] bg-gray-950 text-white border-gray-600"
                />
                <div className="text-xs text-gray-400 mt-1">{extraDetails.length} characters</div>
              </div>

              {/* Time limit */}
              <div>
                <Label htmlFor="time-limit" className="block mb-2 text-gray-300">
                  Time limit (minutes)
                </Label>
                <div className="flex items-center space-x-3">
                  <Input
                    id="time-limit"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={timeLimitMinutes}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isNaN(next) || next < 0) return;
                      setTimeLimitMinutes(next);
                    }}
                    className="w-32 bg-gray-950 text-white border-gray-600"
                  />
                  <span className="text-sm text-gray-400">0 disables the timer</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0 pt-2">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (!scenario) return;
                    const secs = Math.max(0, Math.floor(Number(timeLimitMinutes) * 60));
                    try {
                      // store ephemeral timing config
                      localStorage.setItem(
                        `practice-config-${scenario.id}`,
                        JSON.stringify({ timeLimitSeconds: secs })
                      );
                      // store ephemeral agent prompt context (user extras, talking points, and extracted document)
                      const tp = (talkingPoints || []).map((p) => ({ text: p.text || '', importance: Number(p.importance) || 3 }));
                      localStorage.setItem(
                        `practice-context-${scenario.id}`,
                        JSON.stringify({ 
                          userExtras: extraDetails || '', 
                          talkingPoints: tp,
                          extractedText: extracted?.text || '',
                          extractedMeta: extracted?.meta || null
                        })
                      );
                    } catch {}
                    router.push(`/practice/${scenario.id}`);
                  }}
                >
                  Start Practice
                </Button>
                <Link href={`/practice/${scenario.id}`} className="text-sm text-blue-400 hover:underline">
                  Skip setup and start now
                </Link>
              </div>

              {/* Presentational Flow (only for presentational scenarios) */}
              {scenario.presentational && (
                <div className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base text-white">Presentation Flow</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (flowEdited) {
                            const ok = window.confirm("Regenerate and overwrite your edits?");
                            if (!ok) return;
                          }
                          generateFlow({ force: true });
                        }}
                        disabled={flowLoading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${flowLoading ? 'animate-spin' : ''}`} />
                        {flow ? 'Regenerate' : 'Generate'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => setFlowSavedAt(Date.now())}
                        disabled={!flow}
                      >
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                    </div>
                  </div>
                  {flowError && (
                    <p className="text-xs text-red-600 mb-2">{flowError}</p>
                  )}
                  {flowSavedAt && (
                    <p className="text-xs text-green-600 mb-2">Saved.</p>
                  )}
                  {!flow && !flowLoading && (
                    <p className="text-xs text-gray-400">Generate a structured presentation plan. You can edit and reorder it.</p>
                  )}
                  {flowLoading && (
                    <p className="text-xs text-gray-400">Generating flow…</p>
                  )}

                  {flow && (
                    <div className="space-y-4">
                      {/* Intro */}
                      <div className="border border-gray-600 rounded-md p-3 bg-gray-900">
                        <div className="text-sm font-medium mb-2 text-white">Introduction</div>
                        <SectionEditor
                          section={flow.intro}
                          onChange={(next) => {
                            setFlow({ ...flow, intro: next });
                            setFlowEdited(true);
                          }}
                        />
                      </div>

                      {/* Body Sections */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-white">Sections</div>
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFlow({
                                  ...flow,
                                  sections: [
                                    ...flow.sections,
                                    { id: crypto.randomUUID(), title: "New Section", goals: ["Add a brief goal"] },
                                  ],
                                });
                                setFlowEdited(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add section
                            </Button>
                          </div>
                        </div>
                        {flow.sections.map((sec, idx) => (
                          <div key={sec.id} className="border border-gray-600 rounded-md p-3 bg-gray-900">
                            <div className="flex items-start gap-3">
                              <div className="flex flex-col gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    if (idx === 0) return;
                                    const next = [...flow.sections];
                                    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                    setFlow({ ...flow, sections: next });
                                    setFlowEdited(true);
                                  }}
                                  disabled={idx === 0}
                                  aria-label="Move up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    if (idx === flow.sections.length - 1) return;
                                    const next = [...flow.sections];
                                    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                    setFlow({ ...flow, sections: next });
                                    setFlowEdited(true);
                                  }}
                                  disabled={idx === flow.sections.length - 1}
                                  aria-label="Move down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="flex-1">
                                <SectionEditor
                                  section={sec}
                                  onChange={(next) => {
                                    const updated = [...flow.sections];
                                    updated[idx] = next;
                                    setFlow({ ...flow, sections: updated });
                                    setFlowEdited(true);
                                  }}
                                />
                              </div>
                              <div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  aria-label="Delete section"
                                  onClick={() => {
                                    const next = flow.sections.filter((s) => s.id !== sec.id);
                                    setFlow({ ...flow, sections: next });
                                    setFlowEdited(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Conclusion */}
                      <div className="border border-gray-600 rounded-md p-3 bg-gray-900">
                        <div className="text-sm font-medium mb-2 text-white">Conclusion</div>
                        <SectionEditor
                          section={flow.conclusion}
                          onChange={(next) => {
                            setFlow({ ...flow, conclusion: next });
                            setFlowEdited(true);
                          }}
                        />
                      </div>

                      {/* Q&A */}
                      <div className="border border-gray-600 rounded-md p-3 bg-gray-900">
                        <div className="text-sm font-medium mb-2 text-white">Q&A</div>
                        <SectionEditor
                          section={flow.qa}
                          onChange={(next) => {
                            setFlow({ ...flow, qa: next });
                            setFlowEdited(true);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Talking points */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base text-white">AI Talking Points</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (tpEdited) {
                          const ok = window.confirm("Regenerate and overwrite your edits?");
                          if (!ok) return;
                        }
                        generateTalkingPoints({ force: true });
                      }}
                      disabled={tpLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${tpLoading ? 'animate-spin' : ''}`} />
                      {talkingPoints ? 'Regenerate' : 'Generate'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => setTpSavedAt(Date.now())}
                      disabled={!talkingPoints}
                    >
                      <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                  </div>
                </div>
                {tpError && (
                  <p className="text-xs text-red-600 mb-2">{tpError}</p>
                )}
                {tpSavedAt && (
                  <p className="text-xs text-green-600 mb-2">Saved.</p>
                )}
                {!talkingPoints && !tpLoading && (
                  <p className="text-xs text-gray-400">Generate key points to guide your practice. You can edit and reorder them.</p>
                )}
                {tpLoading && (
                  <p className="text-xs text-gray-400">Generating talking points…</p>
                )}
                {talkingPoints && (
                  <div className="space-y-3">
                    {talkingPoints.map((pt, idx) => (
                      <div key={pt.id} className="border border-gray-600 rounded-md p-3 bg-gray-900">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                if (idx === 0) return;
                                const next = [...talkingPoints];
                                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                setTalkingPoints(next);
                                setTpEdited(true);
                              }}
                              disabled={idx === 0}
                              aria-label="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => {
                                if (idx === talkingPoints.length - 1) return;
                                const next = [...talkingPoints];
                                [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                setTalkingPoints(next);
                                setTpEdited(true);
                              }}
                              disabled={idx === talkingPoints.length - 1}
                              aria-label="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex-1">
                            <Input
                              value={pt.text}
                              onChange={(e) => {
                                const next = [...talkingPoints];
                                next[idx] = { ...pt, text: e.target.value };
                                setTalkingPoints(next);
                                setTpEdited(true);
                              }}
                              placeholder={`Point ${idx + 1}`}
                              className="bg-gray-950 text-white border-gray-600"
                            />
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-xs text-gray-400">Importance</span>
                              <div className="flex-1 max-w-xs">
                                <Slider
                                  value={[pt.importance]}
                                  min={1}
                                  max={5}
                                  step={1}
                                  onValueChange={([val]) => {
                                    const next = [...talkingPoints];
                                    next[idx] = { ...pt, importance: val } as TalkingPoint;
                                    setTalkingPoints(next);
                                    setTpEdited(true);
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-5 text-center">{pt.importance}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                aria-label="Delete point"
                                onClick={() => {
                                  const next = talkingPoints.filter((p) => p.id !== pt.id);
                                  setTalkingPoints(next);
                                  setTpEdited(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!canAddMorePoints) return;
                          setTalkingPoints([
                            ...(talkingPoints || []),
                            { id: crypto.randomUUID(), text: "", importance: 3 },
                          ]);
                          setTpEdited(true);
                        }}
                        disabled={!canAddMorePoints}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add point
                      </Button>
                      {!canAddMorePoints && (
                        <span className="ml-2 text-xs text-gray-400">Maximum of 15 points.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Scenario summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <span>Scenario</span>
                <span className="text-3xl">{scenario.icon}</span>
              </CardTitle>
              <CardDescription className="text-gray-400">{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-400">
                    <Users className="w-4 h-4 mr-2" /> Participants
                  </div>
                  <div>{scenario.participantCount}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-400">
                    <Clock className="w-4 h-4 mr-2" /> Duration
                  </div>
                  <div>
                    {timeLimitMinutes > 0 ? (
                      <>{timeLimitMinutes} min</>
                    ) : (
                      <>Timer off</>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-400">Vibe</div>
                  <div className="capitalize">{scenario.vibe}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-400">Presentational</div>
                  <div>{scenario.presentational ? 'Yes' : 'No'}</div>
                </div>
                <div className="pt-2 text-xs text-gray-400">
                  The timer you set in this setup replaces the default duration.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Prompt preview */}
          <Card className="lg:col-span-1 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Prompt Preview</CardTitle>
              <CardDescription className="text-gray-400">
                Base prompt combined with your extra details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400 mb-2">
                Updates live as you edit details or upload documents
              </div>
              <div className="bg-gray-950 border border-gray-700 rounded p-3 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-auto">
                {composedPrompt || 'Base prompt will appear here'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
