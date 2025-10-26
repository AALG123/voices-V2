import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mic, Users, TrendingUp, Zap } from 'lucide-react';
import { AnimatedTitle } from '@/components/animated-title';
import { IntroFade } from '@/components/IntroFade';
import { Navbar } from '@/components/navbar';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br bg-black overflow-hidden relative">
      <IntroFade />
      <Navbar />
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
      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-0 pt-8 pb-0">
          {/* Announcement Banner */}
          <div className="inline-flex items-center gap-2 px-6 py-3 mb-12 bg-slate-800/50 border border-slate-700 rounded-full text-slate-300">
            <span>Practice real-world social interactions with AI-powered agents.</span>
            <Link href="/scenarios" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
              Read more →
            </Link>
          </div>

          <AnimatedTitle
            text="Master Public Speaking"
            className="font-inter text-6xl md:text-7xl font-bold text-white mb-6 leading-tight"
          />
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Practice real-world social interactions with AI-powered agents.
            Build confidence in any scenario, from parties to presentations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/scenarios">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                Start Practicing Now
              </Button>
            </Link>
            <Button size="lg" variant="ghost" className="text-lg px-8 py-6 text-white hover:text-slate-200 hover:bg-slate-800">
              Learn more →
            </Button>
          </div>


             {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-inter text-xl text-purple-600 font-bold mb-2">Realistic Scenarios</h3>
            <p className="text-white">
              Practice with AI agents in job interviews, presentations, parties, and more
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-inter text-xl text-green-600 font-bold mb-2">Track Progress</h3>
            <p className="text-white">
              Get scored on your performance and see your improvement over time
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-inter text-xl text-orange-600 font-bold mb-2">Adaptive Difficulty</h3>
            <p className="text-white">
              Choose your challenge level and face increasingly complex interactions
            </p>
          </div>
        </div>

          {/* Hero Image - Practice Session Mockup */}
          <div className="mt-16 relative">
            <div className="relative mx-auto max-w-6xl">
              {/* Mockup container */}
              <div className="relative rounded-t-xl overflow-hidden border-t border-x border-slate-700 bg-gray-900 shadow-2xl">
                {/* Top bar */}
                <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-6 bg-slate-700 rounded"></div>
                    <div className="w-32 h-4 bg-slate-600 rounded"></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-4 bg-slate-700 rounded"></div>
                    <div className="w-20 h-4 bg-slate-700 rounded"></div>
                  </div>
                </div>

                {/* Main content area - 3 column layout */}
                <div className="flex h-96">
                  {/* Left sidebar - User video & controls */}
                  <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
                    {/* User video */}
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg aspect-video mb-3 relative">
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        You
                      </div>
                    </div>
                    {/* Control buttons */}
                    <div className="space-y-2">
                      <div className="h-8 bg-slate-700 rounded"></div>
                      <div className="h-8 bg-slate-700 rounded"></div>
                      <div className="h-8 bg-slate-700 rounded"></div>
                      <div className="h-8 bg-red-900 rounded"></div>
                    </div>
                  </div>

                  {/* Center - Agent videos */}
                  <div className="flex-1 p-4 bg-gray-900">
                    <div className="grid grid-cols-2 gap-3 h-full">
                      {/* Agent 1 */}
                      <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-lg relative">
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Agent 1
                        </div>
                      </div>
                      {/* Agent 2 */}
                      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg relative">
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Agent 2
                        </div>
                      </div>
                      {/* Agent 3 */}
                      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg relative">
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Agent 3
                        </div>
                      </div>
                      {/* Agent 4 */}
                      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg relative">
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Agent 4
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right sidebar - Messages */}
                  <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                    <div className="p-3 border-b border-gray-700">
                      <div className="w-20 h-4 bg-slate-600 rounded"></div>
                    </div>
                    <div className="flex-1 p-3 space-y-2">
                      {/* Message bubbles */}
                      <div className="flex justify-end">
                        <div className="bg-blue-600 rounded-lg p-2 max-w-[80%]">
                          <div className="w-32 h-2 bg-blue-400 rounded mb-1"></div>
                          <div className="w-24 h-2 bg-blue-400 rounded"></div>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-700 rounded-lg p-2 max-w-[80%]">
                          <div className="w-28 h-2 bg-slate-500 rounded mb-1"></div>
                          <div className="w-36 h-2 bg-slate-500 rounded"></div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-blue-600 rounded-lg p-2 max-w-[80%]">
                          <div className="w-40 h-2 bg-blue-400 rounded mb-1"></div>
                          <div className="w-28 h-2 bg-blue-400 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 border-t border-gray-700">
                      <div className="h-9 bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

     
      </div>
    </div>
  );
}
