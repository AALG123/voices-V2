import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { scenarios } from '@/lib/scenarios';
import { ArrowLeft, Clock, Users, Mic } from 'lucide-react';
import { IntroFade } from '@/components/IntroFade';

export default function ScenariosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br bg-black overflow-hidden relative">
      <IntroFade />
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
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            Choose Your Scenario
          </h1>
          <p className="text-gray-400">
            Select a practice scenario to begin improving your public speaking skills
          </p>
        </div>

        {/* Quick Access to Interview Practice */}
        <Card className="mb-6 bg-gradient-to-r from-gray-800 to-gray-850 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mic className="w-6 h-6 text-indigo-400" />
                  AI Interview Practice (Voice)
                </CardTitle>
                <CardDescription className="mt-2 text-gray-300">
                  Practice with an AI interviewer using real-time voice conversation
                </CardDescription>
              </div>
              <Link href="/interview-practice">
                <Button size="lg">
                  Try Now
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Scenarios Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className="bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow">
              <CardHeader>
                <div className="text-5xl mb-4">{scenario.icon}</div>
                <CardTitle className="flex items-center justify-between text-white">
                  {scenario.title}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    scenario.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                    scenario.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {scenario.difficulty.toUpperCase()}
                  </span>
                </CardTitle>
                <CardDescription className="text-gray-400">{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {scenario.participantCount} participants
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {Math.floor(scenario.duration / 60)} min
                  </div>
                </div>
                <Link href={`/practice/${scenario.id}/setup`}>
                  <Button className="w-full">
                    Start Practice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}