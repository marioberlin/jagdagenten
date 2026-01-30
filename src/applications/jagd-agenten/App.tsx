import { useState } from 'react';
import DailyCockpit from './components/DailyCockpit';
import ScoutView from './components/ScoutView';
import HuntTimeline from './components/HuntTimeline';
import ChatView from './components/ChatView';
import JournalView from './components/JournalView';

type JagdView = 'cockpit' | 'scout' | 'timeline' | 'journal' | 'bureaucracy' | 'gear' | 'pack' | 'feed' | 'chat' | 'settings';

export default function JagdAgentenApp() {
  const [view, setView] = useState<JagdView>('cockpit');

  return (
    <div className="flex flex-col h-full w-full bg-[var(--glass-bg-primary)] text-[var(--text-primary)]">
      {/* Navigation Bar */}
      <nav className="flex items-center gap-1 px-4 py-2 border-b border-[var(--glass-border)] overflow-x-auto">
        {([
          { id: 'cockpit', label: 'Cockpit' },
          { id: 'scout', label: 'Scout' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'journal', label: 'Journal' },
          { id: 'bureaucracy', label: 'Buerokratie' },
          { id: 'gear', label: 'Quartiermeister' },
          { id: 'pack', label: 'Rudel' },
          { id: 'feed', label: 'Feed' },
          { id: 'chat', label: 'Chat' },
        ] as const).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              view === item.id
                ? 'bg-[var(--glass-accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* View Content */}
      <main className={`flex-1 overflow-auto ${view === 'chat' ? '' : 'p-4'}`}>
        {view === 'cockpit' && <DailyCockpit />}
        {view === 'scout' && <ScoutView />}
        {view === 'timeline' && <HuntTimeline />}
        {view === 'journal' && <JournalView />}
        {view === 'bureaucracy' && <PlaceholderView name="Buerokratie" />}
        {view === 'gear' && <PlaceholderView name="Quartiermeister" />}
        {view === 'pack' && <PlaceholderView name="Rudel" />}
        {view === 'feed' && <PlaceholderView name="Waidmann-Feed" />}
        {view === 'chat' && <ChatView />}
      </main>
    </div>
  );
}

function PlaceholderView({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)]">
        <h2 className="text-xl font-bold mb-2">{name}</h2>
        <p className="text-[var(--text-secondary)]">Wird implementiert...</p>
      </div>
    </div>
  );
}
