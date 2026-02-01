import { useState } from 'react';
import DailyCockpit from './components/DailyCockpit';
import ScoutView from './components/ScoutView';
import HuntTimeline from './components/HuntTimeline';
import ChatView from './components/ChatView';
import JournalView from './components/JournalView';
import { DocumentVault } from './components/DocumentVault';
import { ExportPackGenerator } from './components/ExportPackGenerator';
import { EquipmentInventory } from './components/EquipmentInventory';
import { WaidmannFeed } from './components/WaidmannFeed';
import { WeeklyExplore } from './components/WeeklyExplore';
import { PackDashboard } from './components/PackDashboard';
import { GlobalAdminDashboard } from './components/admin';
import { HegeDashboard } from './components/HegeDashboard';
import { WildunfallMode } from './components/WildunfallMode';
import { NachsucheFlow } from './components/NachsucheFlow';
import { SightingRadar } from './components/SightingRadar';
import { TrailCameraFeed } from './components/TrailCameraFeed';

type JagdView =
  | 'cockpit' | 'scout' | 'timeline' | 'journal' | 'bureaucracy'
  | 'exports' | 'gear' | 'pack' | 'feed' | 'explore'
  | 'admin' | 'chat' | 'settings'
  | 'hege' | 'wildunfall' | 'nachsuche' | 'sightings' | 'trailcam';

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
          { id: 'hege', label: 'Hege' },
          { id: 'wildunfall', label: 'Wildunfall' },
          { id: 'nachsuche', label: 'Nachsuche' },
          { id: 'sightings', label: 'Sichtungen' },
          { id: 'trailcam', label: 'Wildkameras' },
          { id: 'bureaucracy', label: 'Dokumente' },
          { id: 'exports', label: 'Exporte' },
          { id: 'gear', label: 'Ausrüstung' },
          { id: 'pack', label: 'Rudel' },
          { id: 'feed', label: 'Feed' },
          { id: 'explore', label: 'Übersicht' },
          { id: 'admin', label: 'Verwaltung' },
          { id: 'chat', label: 'Chat' },
        ] as const).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${view === item.id
              ? 'bg-[var(--glass-accent)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--glass-surface-hover)]'
              }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* View Content */}
      <main className={`flex-1 overflow-auto ${view === 'chat' ? '' : ''}`}>
        {view === 'cockpit' && <DailyCockpit />}
        {view === 'scout' && <ScoutView />}
        {view === 'timeline' && <HuntTimeline />}
        {view === 'journal' && <JournalView />}
        {view === 'hege' && <HegeDashboard />}
        {view === 'wildunfall' && <WildunfallMode />}
        {view === 'nachsuche' && <NachsucheFlow />}
        {view === 'sightings' && <SightingRadar />}
        {view === 'trailcam' && <TrailCameraFeed />}
        {view === 'bureaucracy' && <DocumentVault />}
        {view === 'exports' && <ExportPackGenerator />}
        {view === 'gear' && <EquipmentInventory />}
        {view === 'pack' && <PackDashboard />}
        {view === 'feed' && <WaidmannFeed />}
        {view === 'explore' && <WeeklyExplore />}
        {view === 'admin' && <GlobalAdminDashboard />}
        {view === 'chat' && <ChatView />}
      </main>
    </div>
  );
}
