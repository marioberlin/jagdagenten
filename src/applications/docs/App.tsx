import { useState, lazy, Suspense } from 'react';
import { cn } from '@/utils/cn';
import { ChevronLeft, BookOpen, FileText } from 'lucide-react';

// Lazy-loaded doc pages
const CopilotDocs = lazy(() => import('@/pages/showcase/CopilotDocs'));
const AIResearcherDocs = lazy(() => import('@/pages/showcase/AIResearcherDocs'));
const DynamicDashboardDocs = lazy(() => import('@/pages/showcase/DynamicDashboardDocs'));
const QAAgentDocs = lazy(() => import('@/pages/showcase/QAAgentDocs'));
const ResearchCanvasDocs = lazy(() => import('@/pages/showcase/ResearchCanvasDocs'));
const StateMachineDocs = lazy(() => import('@/pages/showcase/StateMachineDocs'));
const TravelPlannerDocs = lazy(() => import('@/pages/showcase/TravelPlannerDocs'));
const GenerativeShowcaseDocs = lazy(() => import('@/pages/showcase/GenerativeShowcaseDocs'));
const GenerativeExtensionsDocs = lazy(() => import('@/pages/showcase/GenerativeExtensionsDocs'));
const AuditDocs = lazy(() => import('@/pages/showcase/AuditDocs'));

type DocId = 'copilot' | 'ai-researcher' | 'dynamic-dashboard' | 'qa-agent'
  | 'research-canvas' | 'state-machine' | 'travel-planner'
  | 'generative-showcase' | 'generative-extensions' | 'audit';

interface DocEntry {
  id: DocId;
  title: string;
  description: string;
}

const DOCS: DocEntry[] = [
  { id: 'copilot', title: 'Copilot', description: 'AI copilot form interaction guide' },
  { id: 'ai-researcher', title: 'AI Researcher', description: 'Autonomous research agent documentation' },
  { id: 'dynamic-dashboard', title: 'Dynamic Dashboard', description: 'Real-time dashboard creation guide' },
  { id: 'qa-agent', title: 'QA Agent', description: 'Question-answering agent documentation' },
  { id: 'research-canvas', title: 'Research Canvas', description: 'Collaborative research workspace guide' },
  { id: 'state-machine', title: 'State Machine', description: 'State machine workflow documentation' },
  { id: 'travel-planner', title: 'Travel Planner', description: 'Travel planning feature guide' },
  { id: 'generative-showcase', title: 'Generative Showcase', description: 'Generative UI components documentation' },
  { id: 'generative-extensions', title: 'Generative Extensions', description: 'Generative extensions guide' },
  { id: 'audit', title: 'Audit & Logging', description: 'Security audit and logging documentation' },
];

function DocComponent({ id }: { id: DocId }) {
  switch (id) {
    case 'copilot': return <CopilotDocs />;
    case 'ai-researcher': return <AIResearcherDocs />;
    case 'dynamic-dashboard': return <DynamicDashboardDocs />;
    case 'qa-agent': return <QAAgentDocs />;
    case 'research-canvas': return <ResearchCanvasDocs />;
    case 'state-machine': return <StateMachineDocs />;
    case 'travel-planner': return <TravelPlannerDocs />;
    case 'generative-showcase': return <GenerativeShowcaseDocs />;
    case 'generative-extensions': return <GenerativeExtensionsDocs />;
    case 'audit': return <AuditDocs />;
    default: return null;
  }
}

export default function DocsApp() {
  const [activeDoc, setActiveDoc] = useState<DocId | null>(null);

  if (activeDoc) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center px-4 py-2 border-b border-[var(--glass-border)] bg-[var(--glass-surface)]/30">
          <button
            onClick={() => setActiveDoc(null)}
            className="flex items-center gap-1.5 text-sm text-[var(--glass-text-secondary)] hover:text-[var(--glass-text-primary)] transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Docs
          </button>
          <span className="ml-3 text-sm font-medium text-[var(--glass-text-primary)]">
            {DOCS.find(d => d.id === activeDoc)?.title}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          }>
            <DocComponent id={activeDoc} />
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
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20">
            <BookOpen className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
          Documentation
        </h1>
        <p className="text-sm text-white/60 max-w-xl mx-auto">
          Feature guides and reference documentation.
        </p>
      </div>

      {/* Doc List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {DOCS.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200',
              'bg-white/[0.03] border border-white/10',
              'hover:bg-white/[0.08] hover:border-white/20 hover:translate-y-[-1px]'
            )}
          >
            <FileText className="w-4 h-4 mt-0.5 text-blue-400/70 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-white mb-0.5">{doc.title}</h4>
              <p className="text-xs text-white/50">{doc.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
