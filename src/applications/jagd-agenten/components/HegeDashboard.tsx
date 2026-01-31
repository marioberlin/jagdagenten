/**
 * Hege & Pflege Dashboard
 *
 * Conservation work project management and activity logging.
 */

import React, { useState } from 'react';
import { Leaf, Bird, TreePine, Wrench, Plus, CheckCircle } from 'lucide-react';

type ProjectType = 'revierarbeit' | 'kitzrettung' | 'feeding_round' | 'nest_boxes' | 'habitat' | 'infrastructure';

interface HegeProject {
    id: string;
    type: ProjectType;
    title: string;
    date: string;
    status: 'planned' | 'active' | 'completed';
    tasksTotal: number;
    tasksCompleted: number;
}

interface HegeActivity {
    id: string;
    type: string;
    time: string;
    location: string;
}

const PROJECT_TYPES: Record<ProjectType, { label: string; icon: React.ReactNode; color: string }> = {
    revierarbeit: { label: 'Revierarbeit', icon: <Wrench className="w-5 h-5" />, color: 'blue' },
    kitzrettung: { label: 'Kitzrettung', icon: <Leaf className="w-5 h-5" />, color: 'green' },
    feeding_round: { label: 'Fütterung', icon: <TreePine className="w-5 h-5" />, color: 'amber' },
    nest_boxes: { label: 'Nistkästen', icon: <Bird className="w-5 h-5" />, color: 'purple' },
    habitat: { label: 'Biotop', icon: <Leaf className="w-5 h-5" />, color: 'emerald' },
    infrastructure: { label: 'Hochsitze', icon: <Wrench className="w-5 h-5" />, color: 'orange' },
};

export function HegeDashboard() {
    const [activeTab, setActiveTab] = useState<'projects' | 'activities' | 'create'>('projects');

    // Mock data
    const mockProjects: HegeProject[] = [
        { id: '1', type: 'revierarbeit', title: 'Revierarbeit Samstag', date: '2026-02-01', status: 'planned', tasksTotal: 5, tasksCompleted: 0 },
        { id: '2', type: 'feeding_round', title: 'Wöchentliche Fütterung', date: '2026-01-30', status: 'active', tasksTotal: 3, tasksCompleted: 2 },
        { id: '3', type: 'nest_boxes', title: 'Nistkästen-Reinigung', date: '2026-01-25', status: 'completed', tasksTotal: 8, tasksCompleted: 8 },
    ];

    const mockActivities: HegeActivity[] = [
        { id: '1', type: 'feeding', time: '2026-01-30T08:00:00', location: 'Kirrung Nord' },
        { id: '2', type: 'infrastructure', time: '2026-01-29T14:00:00', location: 'Hochsitz Eiche' },
        { id: '3', type: 'habitat', time: '2026-01-28T10:00:00', location: 'Wildwiese Süd' },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    Hege & Pflege
                </h2>
                <button
                    onClick={() => setActiveTab('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Neu
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-[var(--glass-border)]">
                {[
                    { id: 'projects', label: 'Aktionen' },
                    { id: 'activities', label: 'Aktivitäten' },
                ].map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as typeof activeTab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === id
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Projects Tab */}
            {activeTab === 'projects' && (
                <div className="space-y-3">
                    {mockProjects.map((project) => {
                        const typeInfo = PROJECT_TYPES[project.type];
                        return (
                            <div
                                key={project.id}
                                className="bg-[var(--glass-bg-regular)] backdrop-blur-md rounded-xl border border-[var(--glass-border)] p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg bg-${typeInfo.color}-500/15 text-${typeInfo.color}-400`}>
                                        {typeInfo.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-[var(--text-primary)] truncate">
                                                {project.title}
                                            </h3>
                                            <StatusBadge status={project.status} />
                                        </div>
                                        <p className="text-sm text-[var(--text-tertiary)] mb-2">
                                            {typeInfo.label} • {new Date(project.date).toLocaleDateString('de-DE')}
                                        </p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                                                <CheckCircle className="w-4 h-4" />
                                                {project.tasksCompleted}/{project.tasksTotal}
                                            </span>
                                            <div className="flex-1 h-2 bg-[var(--glass-surface)] rounded-full">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{
                                                        width: `${(project.tasksCompleted / project.tasksTotal) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
                <div className="space-y-3">
                    {mockActivities.map((activity) => (
                        <div
                            key={activity.id}
                            className="bg-[var(--glass-bg-regular)] backdrop-blur-md rounded-xl border border-[var(--glass-border)] p-4 flex items-center gap-3"
                        >
                            <div className="p-2 bg-green-500/15 rounded-lg text-green-400">
                                <Leaf className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-[var(--text-primary)] capitalize">
                                    {activity.type}
                                </p>
                                <p className="text-sm text-[var(--text-tertiary)]">
                                    {activity.location} • {new Date(activity.time).toLocaleDateString('de-DE')}
                                </p>
                            </div>
                        </div>
                    ))}

                    <button className="w-full py-3 border-2 border-dashed border-[var(--glass-border)] rounded-xl text-[var(--text-tertiary)] hover:border-green-500 hover:text-green-600 transition-colors">
                        + Aktivität loggen
                    </button>
                </div>
            )}

            {/* Create Tab */}
            {activeTab === 'create' && (
                <CreateProjectForm onCancel={() => setActiveTab('projects')} />
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: 'planned' | 'active' | 'completed' }) {
    const config = {
        planned: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Geplant' },
        active: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Aktiv' },
        completed: { bg: 'bg-green-500/15', text: 'text-green-400', label: 'Erledigt' },
    };
    const c = config[status];
    return <span className={`px-2 py-0.5 ${c.bg} ${c.text} rounded text-xs font-medium`}>{c.label}</span>;
}

function CreateProjectForm({ onCancel }: { onCancel: () => void }) {
    const [type, setType] = useState<ProjectType>('revierarbeit');
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Neue Aktion erstellen</h3>

            {/* Type selection */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Art der Aktion
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(PROJECT_TYPES) as [ProjectType, typeof PROJECT_TYPES[ProjectType]][]).map(
                        ([key, { label, icon }]) => (
                            <button
                                key={key}
                                onClick={() => setType(key)}
                                className={`p-3 rounded-lg text-left transition-all ${type === key
                                    ? 'bg-green-500/15 border-2 border-green-500'
                                    : 'bg-[var(--glass-surface)] border border-[var(--glass-border)]'
                                    }`}
                            >
                                <div className="text-[var(--text-secondary)] mb-1">{icon}</div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Titel
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z.B. Revierarbeit Samstag"
                    className="w-full px-4 py-2 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-lg"
                />
            </div>

            {/* Date */}
            <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Datum
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--glass-surface)] border border-[var(--glass-border)] rounded-lg"
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-3 bg-[var(--glass-surface)] text-[var(--text-secondary)] rounded-xl font-medium"
                >
                    Abbrechen
                </button>
                <button className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium">
                    Erstellen
                </button>
            </div>
        </div>
    );
}
