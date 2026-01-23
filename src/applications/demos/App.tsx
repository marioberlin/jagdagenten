import { useState, lazy, Suspense } from 'react';
import { cn } from '@/utils/cn';
import { GlassContainer } from '@/components/primitives/GlassContainer';
import { ChevronLeft, Rocket, FlaskConical, Sparkles, Box, FileText, BarChart3, Puzzle, Globe, PenSquare, Map, Cpu, Cloud } from 'lucide-react';

// Lazy-loaded demo components
const GenerativeShowcase = lazy(() => import('@/pages/demos/GenerativeShowcase'));
const GenerativeExtensions = lazy(() => import('@/pages/demos/GenerativeExtensions'));
const CopilotFormDemo = lazy(() => import('@/pages/demos/CopilotFormDemo'));
const DynamicDashboardDemo = lazy(() => import('@/pages/demos/DynamicDashboardDemo'));
const StateMachineDemo = lazy(() => import('@/pages/demos/StateMachineDemo'));
const QAAgentDemo = lazy(() => import('@/pages/demos/QAAgentDemo'));
const ResearchCanvasDemo = lazy(() => import('@/pages/demos/ResearchCanvasDemo'));
const TravelPlannerDemo = lazy(() => import('@/pages/demos/TravelPlannerDemo'));
const AuroraWeatherDemo = lazy(() => import('@/pages/demos/AuroraWeatherDemo'));
const AIResearcherDemo = lazy(() => import('@/pages/demos/AIResearcherDemo'));
const FoundationDemo = lazy(() => import('@/pages/demos/FoundationDemo'));
const SignatureDemo = lazy(() => import('@/pages/demos/SignatureDemo'));
const ExtensionDemo = lazy(() => import('@/pages/demos/ExtensionDemo').then(mod => ({ default: mod.ExtensionDemo })));
const RemotePasswordDemo = lazy(() => import('@/pages/demos/RemotePasswordDemo'));
const NeonTokyoDemo = lazy(() => import('@/pages/demos/NeonTokyoDemo'));

type DemoId = 'aurora-weather' | 'ai-researcher' | 'copilot-form' | 'dynamic-dashboard'
  | 'extension' | 'foundation' | 'qa-agent' | 'research-canvas' | 'signature'
  | 'state-machine' | 'travel-planner' | 'remote-password' | 'neon-tokyo'
  | 'generative' | 'generative-extensions';

interface DemoEntry {
  id: DemoId;
  title: string;
  description: string;
  icon: React.ElementType;
  tags: string[];
  status: 'stable' | 'beta' | 'experimental';
}

const DEMOS: DemoEntry[] = [
  { id: 'aurora-weather', title: 'Aurora Weather', description: 'Liquid Glass weather experience with material reactivity', icon: Cloud, tags: ['Weather', 'A2A'], status: 'stable' },
  { id: 'ai-researcher', title: 'AI Researcher', description: 'Autonomous research agent with multi-step reasoning', icon: FlaskConical, tags: ['Agent', 'Research'], status: 'stable' },
  { id: 'copilot-form', title: 'Copilot Form', description: 'AI-assisted form filling with natural language', icon: Sparkles, tags: ['Copilot', 'Forms'], status: 'stable' },
  { id: 'dynamic-dashboard', title: 'Dynamic Dashboard', description: 'Real-time dashboard with AI-generated insights', icon: BarChart3, tags: ['Dashboard', 'Charts'], status: 'stable' },
  { id: 'extension', title: 'Extension Demo', description: 'Browser extension integration', icon: Puzzle, tags: ['Extension'], status: 'beta' },
  { id: 'foundation', title: 'Foundation', description: 'Core component library showcase', icon: Box, tags: ['Components'], status: 'stable' },
  { id: 'qa-agent', title: 'QA Agent', description: 'Question-answering agent with citations', icon: FileText, tags: ['Agent', 'RAG'], status: 'stable' },
  { id: 'research-canvas', title: 'Research Canvas', description: 'Collaborative research workspace', icon: PenSquare, tags: ['Canvas'], status: 'beta' },
  { id: 'signature', title: 'Signature Demo', description: 'Digital signature capture component', icon: PenSquare, tags: ['Input'], status: 'stable' },
  { id: 'state-machine', title: 'State Machine', description: 'Visual state machine editor', icon: Cpu, tags: ['XState'], status: 'experimental' },
  { id: 'travel-planner', title: 'Travel Planner', description: 'AI-powered travel itinerary planning', icon: Map, tags: ['Agent', 'Maps'], status: 'stable' },
  { id: 'remote-password', title: 'Remote Password', description: 'Remote A2A agent for password generation', icon: Globe, tags: ['Remote', 'A2A'], status: 'stable' },
  { id: 'neon-tokyo', title: 'Neon Tokyo', description: 'Hyper-personalized travel concierge', icon: Sparkles, tags: ['Travel', 'A2A'], status: 'experimental' },
  { id: 'generative', title: 'Generative Showcase', description: 'Generative UI component showcase', icon: Sparkles, tags: ['Generative'], status: 'stable' },
  { id: 'generative-extensions', title: 'Generative Extensions', description: 'Generative extensions capabilities', icon: Sparkles, tags: ['Extensions'], status: 'beta' },
];

function DemoComponent({ id }: { id: DemoId }) {
  switch (id) {
    case 'aurora-weather': return <AuroraWeatherDemo />;
    case 'ai-researcher': return <AIResearcherDemo />;
    case 'copilot-form': return <CopilotFormDemo />;
    case 'dynamic-dashboard': return <DynamicDashboardDemo />;
    case 'extension': return <ExtensionDemo />;
    case 'foundation': return <FoundationDemo />;
    case 'qa-agent': return <QAAgentDemo />;
    case 'research-canvas': return <ResearchCanvasDemo />;
    case 'signature': return <SignatureDemo />;
    case 'state-machine': return <StateMachineDemo />;
    case 'travel-planner': return <TravelPlannerDemo />;
    case 'remote-password': return <RemotePasswordDemo />;
    case 'neon-tokyo': return <NeonTokyoDemo />;
    case 'generative': return <GenerativeShowcase />;
    case 'generative-extensions': return <GenerativeExtensions />;
    default: return null;
  }
}

export default function DemosApp() {
  const [activeDemo, setActiveDemo] = useState<DemoId | null>(null);

  if (activeDemo) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-[var(--glass-border)] bg-[var(--glass-surface)]/30">
          <button
            onClick={() => setActiveDemo(null)}
            className="flex items-center gap-1.5 text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Demos
          </button>
          <span className="ml-3 text-sm font-medium text-[var(--glass-text-primary)]">
            {DEMOS.find(d => d.id === activeDemo)?.title}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          }>
            <DemoComponent id={activeDemo} />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20">
            <Rocket className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
          Interactive Demos
        </h1>
        <p className="text-sm text-white/60 max-w-xl mx-auto">
          Explore capabilities through interactive demonstrations.
        </p>
      </div>

      {/* Demo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {DEMOS.map((demo) => {
          const Icon = demo.icon;
          const statusColors = {
            stable: 'bg-green-500/20 text-green-400 border-green-500/30',
            beta: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            experimental: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          };
          return (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              className="group text-left"
            >
              <GlassContainer className={cn(
                'p-5 h-full transition-all duration-300',
                'hover:bg-white/[0.08] hover:border-white/20',
                'hover:translate-y-[-2px]'
              )}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                    <Icon className="w-5 h-5 text-white/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white">{demo.title}</h4>
                      {demo.status !== 'stable' && (
                        <span className={cn('px-1.5 py-0.5 text-[10px] rounded-full border', statusColors[demo.status])}>
                          {demo.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60 mb-2">{demo.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {demo.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/5 text-white/50 border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassContainer>
            </button>
          );
        })}
      </div>
    </div>
  );
}
