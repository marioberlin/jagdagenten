/**
 * Weekly Explore Component
 *
 * Hub for 8 weekly "magazine-style" dashboards:
 * 1. Revier Pulse - Territory activity
 * 2. Waidmann Heatmap - Anonymous sighting intensity
 * 3. Wolf Watch - DBBW + community wolf monitoring
 * 4. Season & Rules - Hunting seasons + deadlines
 * 5. Büchsenlicht & Moon - Shooting light + moon planner
 * 6. Gear Health - Equipment maintenance
 * 7. Story of the Week - Featured community stories
 * 8. Huntcraft Challenges - Gamified challenges
 */

import React, { useState } from 'react';
import {
    Activity,
    Map,
    Shield,
    Calendar,
    Sun,
    Wrench,
    BookOpen,
    Trophy,
} from 'lucide-react';

// Import all dashboard components
import RevierPulse from './Explore/RevierPulse';
import WaidmannHeatmap from './Explore/WaidmannHeatmap';
import WolfWatch from './Explore/WolfWatch';
import SeasonRules from './Explore/SeasonRules';
import BuechsenlichtMoon from './Explore/BuechsenlichtMoon';
import GearHealth from './Explore/GearHealth';
import StoryOfWeek from './Explore/StoryOfWeek';
import HuntcraftChallenges from './Explore/HuntcraftChallenges';

// ============================================================================
// Types
// ============================================================================

type ExploreTab =
    | 'pulse'
    | 'heatmap'
    | 'wolf'
    | 'season'
    | 'buechsenlicht'
    | 'gear'
    | 'story'
    | 'challenges';

interface TabConfig {
    id: ExploreTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    component: React.ComponentType;
}

// ============================================================================
// Tab Configuration
// ============================================================================

const EXPLORE_TABS: TabConfig[] = [
    { id: 'pulse', label: 'Revier Pulse', shortLabel: 'Pulse', icon: Activity, component: RevierPulse },
    { id: 'heatmap', label: 'Waidmann Heatmap', shortLabel: 'Heatmap', icon: Map, component: WaidmannHeatmap },
    { id: 'wolf', label: 'Wolf Watch', shortLabel: 'Wolf', icon: Shield, component: WolfWatch },
    { id: 'season', label: 'Saison & Regeln', shortLabel: 'Saison', icon: Calendar, component: SeasonRules },
    { id: 'buechsenlicht', label: 'Büchsenlicht', shortLabel: 'Licht', icon: Sun, component: BuechsenlichtMoon },
    { id: 'gear', label: 'Ausrüstung', shortLabel: 'Gear', icon: Wrench, component: GearHealth },
    { id: 'story', label: 'Story der Woche', shortLabel: 'Story', icon: BookOpen, component: StoryOfWeek },
    { id: 'challenges', label: 'Waidwerk', shortLabel: 'Waidwerk', icon: Trophy, component: HuntcraftChallenges },
];

// ============================================================================
// Main Component
// ============================================================================

export function WeeklyExplore() {
    const [activeTab, setActiveTab] = useState<ExploreTab>('pulse');

    const activeConfig = EXPLORE_TABS.find(t => t.id === activeTab)!;
    const ActiveComponent = activeConfig.component;

    return (
        <div className="weekly-explore">
            {/* Tab Navigation */}
            <nav className="explore-tabs">
                {EXPLORE_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = tab.id === activeTab;

                    return (
                        <button
                            key={tab.id}
                            className={`tab-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                        >
                            <Icon className="tab-icon" />
                            <span className="tab-label">{tab.shortLabel}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Dashboard Content */}
            <div className="explore-content">
                <ActiveComponent />
            </div>

            <style>{`
                .weekly-explore {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    background: var(--glass-bg-thick);
                }

                .explore-tabs {
                    display: flex;
                    gap: 4px;
                    padding: 12px 16px;
                    background: var(--glass-bg-regular);
                    border-bottom: 1px solid var(--glass-border);
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .explore-tabs::-webkit-scrollbar {
                    display: none;
                }

                .tab-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 12px;
                    background: transparent;
                    border: 1px solid transparent;
                    border-radius: 10px;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 64px;
                    flex-shrink: 0;
                }

                .tab-btn:hover {
                    background: var(--glass-surface);
                    color: var(--text-secondary);
                }

                .tab-btn.active {
                    background: rgba(16, 185, 129, 0.1);
                    border-color: rgba(16, 185, 129, 0.3);
                    color: #10b981;
                }

                .tab-icon {
                    width: 20px;
                    height: 20px;
                }

                .tab-label {
                    font-size: 0.65rem;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .explore-content {
                    flex: 1;
                    overflow-y: auto;
                }

                /* Responsive: Larger screens show full labels */
                @media (min-width: 768px) {
                    .tab-btn {
                        flex-direction: row;
                        gap: 8px;
                        padding: 10px 16px;
                        min-width: auto;
                    }
                    .tab-label {
                        font-size: 0.8rem;
                    }
                }
            `}</style>
        </div>
    );
}

export default WeeklyExplore;
