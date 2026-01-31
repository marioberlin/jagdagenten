/**
 * Gear Health Report Dashboard
 *
 * - Days since zero check per weapon
 * - Ammo burn rate chart
 * - Maintenance due list
 * - One-tap checklist
 */

import { useState, useEffect } from 'react';
import {
    Wrench,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    Crosshair,
    Package,
    RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Weapon {
    id: string;
    name: string;
    type: 'rifle' | 'shotgun' | 'handgun';
    lastZeroCheck: string;
    daysSinceZero: number;
    status: 'ok' | 'due_soon' | 'overdue';
}

interface AmmoStats {
    caliber: string;
    currentStock: number;
    monthlyUsage: number;
    monthsRemaining: number;
    trend: 'up' | 'down' | 'stable';
}

interface MaintenanceTask {
    id: string;
    weaponName: string;
    task: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
}

interface GearHealthData {
    weapons: Weapon[];
    ammoStats: AmmoStats[];
    maintenanceTasks: MaintenanceTask[];
    overallScore: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

function getMockData(): GearHealthData {
    return {
        weapons: [
            { id: '1', name: 'Blaser R8', type: 'rifle', lastZeroCheck: '2026-01-15', daysSinceZero: 15, status: 'ok' },
            { id: '2', name: 'Sauer 404', type: 'rifle', lastZeroCheck: '2025-11-20', daysSinceZero: 71, status: 'due_soon' },
            { id: '3', name: 'Beretta 692', type: 'shotgun', lastZeroCheck: '2025-09-01', daysSinceZero: 151, status: 'overdue' },
        ],
        ammoStats: [
            { caliber: '.308 Win', currentStock: 120, monthlyUsage: 25, monthsRemaining: 4.8, trend: 'stable' },
            { caliber: '12/76', currentStock: 75, monthlyUsage: 40, monthsRemaining: 1.9, trend: 'up' },
            { caliber: '9.3x62', currentStock: 40, monthlyUsage: 10, monthsRemaining: 4, trend: 'down' },
        ],
        maintenanceTasks: [
            { id: '1', weaponName: 'Beretta 692', task: 'Grundreinigung', dueDate: '2026-02-01', priority: 'high', completed: false },
            { id: '2', weaponName: 'Blaser R8', task: 'Schalldämpfer trocknen', dueDate: '2026-02-05', priority: 'medium', completed: false },
            { id: '3', weaponName: 'Sauer 404', task: 'Nullpunkt kontrollieren', dueDate: '2026-02-10', priority: 'medium', completed: false },
            { id: '4', weaponName: 'Alle Waffen', task: 'Waffenschrank-Check', dueDate: '2026-02-15', priority: 'low', completed: false },
        ],
        overallScore: 72,
    };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WeaponCard({ weapon }: { weapon: Weapon }) {
    const statusConfig = {
        ok: { label: 'OK', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        due_soon: { label: 'Bald fällig', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        overdue: { label: 'Überfällig', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    };

    const config = statusConfig[weapon.status];

    return (
        <div className="weapon-card" style={{ borderLeftColor: config.color }}>
            <div className="weapon-info">
                <Crosshair className="w-4 h-4" />
                <div>
                    <span className="weapon-name">{weapon.name}</span>
                    <span className="last-check">
                        <Clock className="w-3 h-3" />
                        Vor {weapon.daysSinceZero} Tagen
                    </span>
                </div>
            </div>
            <span className="status-badge" style={{ background: config.bg, color: config.color }}>
                {config.label}
            </span>

            <style>{`
                .weapon-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-left: 3px solid;
                    border-radius: 10px;
                }
                .weapon-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .weapon-name {
                    display: block;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .last-check {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}

function AmmoCard({ ammo }: { ammo: AmmoStats }) {
    const isLow = ammo.monthsRemaining < 2;

    return (
        <div className={`ammo-card ${isLow ? 'low' : ''}`}>
            <div className="ammo-header">
                <Package className="w-4 h-4" />
                <span className="caliber">{ammo.caliber}</span>
            </div>
            <div className="ammo-stats">
                <div className="stat">
                    <span className="stat-value">{ammo.currentStock}</span>
                    <span className="stat-label">Vorrat</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{ammo.monthlyUsage}</span>
                    <span className="stat-label">/Monat</span>
                </div>
                <div className="stat">
                    <span className={`stat-value ${isLow ? 'warning' : ''}`}>
                        {ammo.monthsRemaining.toFixed(1)}
                    </span>
                    <span className="stat-label">Monate</span>
                </div>
            </div>

            <style>{`
                .ammo-card {
                    padding: 12px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                }
                .ammo-card.low {
                    border-color: rgba(245, 158, 11, 0.5);
                }
                .ammo-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                }
                .caliber {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .ammo-stats {
                    display: flex;
                    justify-content: space-between;
                }
                .stat {
                    text-align: center;
                }
                .stat-value {
                    display: block;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .stat-value.warning {
                    color: #f59e0b;
                }
                .stat-label {
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                }
            `}</style>
        </div>
    );
}

function TaskItem({
    task,
    onToggle,
}: {
    task: MaintenanceTask;
    onToggle: (id: string) => void;
}) {
    const priorityConfig = {
        high: { color: '#ef4444' },
        medium: { color: '#f59e0b' },
        low: { color: '#10b981' },
    };

    return (
        <div className={`task-item ${task.completed ? 'completed' : ''}`}>
            <button className="checkbox" onClick={() => onToggle(task.id)}>
                {task.completed ? (
                    <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
                ) : (
                    <div className="checkbox-empty" style={{ borderColor: priorityConfig[task.priority].color }} />
                )}
            </button>
            <div className="task-info">
                <span className="task-name">{task.task}</span>
                <span className="task-weapon">{task.weaponName}</span>
            </div>
            <span className="task-due">
                {new Date(task.dueDate).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
            </span>

            <style>{`
                .task-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    background: var(--glass-bg-regular);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                }
                .task-item.completed {
                    opacity: 0.5;
                }
                .checkbox {
                    background: none;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                }
                .checkbox-empty {
                    width: 20px;
                    height: 20px;
                    border: 2px solid;
                    border-radius: 50%;
                }
                .task-info {
                    flex: 1;
                }
                .task-name {
                    display: block;
                    font-size: 0.9rem;
                    color: var(--text-primary);
                }
                .task-weapon {
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                }
                .task-due {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function GearHealth() {
    const [data, setData] = useState<GearHealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setData(getMockData());
            setLoading(false);
        }, 400);
    }, []);

    const handleToggleTask = (id: string) => {
        if (!data) return;
        setData({
            ...data,
            maintenanceTasks: data.maintenanceTasks.map(t =>
                t.id === id ? { ...t, completed: !t.completed } : t
            ),
        });
    };

    if (loading || !data) {
        return (
            <div className="gear-loading">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Lade Ausrüstung...</span>
            </div>
        );
    }

    const overdueCount = data.weapons.filter(w => w.status === 'overdue').length;
    const pendingTasks = data.maintenanceTasks.filter(t => !t.completed).length;

    return (
        <div className="gear-health">
            {/* Header */}
            <div className="gear-header">
                <div className="header-title">
                    <Wrench className="w-5 h-5" />
                    <h2>Ausrüstungs-Check</h2>
                </div>
                <div
                    className="health-score"
                    style={{
                        color: data.overallScore >= 80 ? '#10b981' :
                            data.overallScore >= 60 ? '#f59e0b' : '#ef4444',
                    }}
                >
                    {data.overallScore}%
                </div>
            </div>

            {/* Alerts */}
            {(overdueCount > 0 || pendingTasks > 0) && (
                <div className="alerts-banner">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                        {overdueCount > 0 && `${overdueCount} Nullpunkt überfällig`}
                        {overdueCount > 0 && pendingTasks > 0 && ' · '}
                        {pendingTasks > 0 && `${pendingTasks} Aufgaben offen`}
                    </span>
                </div>
            )}

            {/* Zero Check Status */}
            <section className="section">
                <h3 className="section-title">
                    <Target className="w-4 h-4" />
                    Nullpunkt-Status
                </h3>
                <div className="weapons-list">
                    {data.weapons.map(w => (
                        <WeaponCard key={w.id} weapon={w} />
                    ))}
                </div>
            </section>

            {/* Ammo Levels */}
            <section className="section">
                <h3 className="section-title">
                    <Package className="w-4 h-4" />
                    Munitions-Vorrat
                </h3>
                <div className="ammo-grid">
                    {data.ammoStats.map((a, i) => (
                        <AmmoCard key={i} ammo={a} />
                    ))}
                </div>
            </section>

            {/* Maintenance Tasks */}
            <section className="section">
                <h3 className="section-title">
                    <Wrench className="w-4 h-4" />
                    Wartungs-Aufgaben ({pendingTasks})
                </h3>
                <div className="tasks-list">
                    {data.maintenanceTasks.map(t => (
                        <TaskItem key={t.id} task={t} onToggle={handleToggleTask} />
                    ))}
                </div>
            </section>

            <style>{`
                .gear-health {
                    padding: 16px;
                }
                .gear-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 60px;
                    color: var(--text-secondary);
                }
                .gear-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 16px;
                }
                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .header-title h2 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }
                .health-score {
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                .alerts-banner {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 10px;
                    margin-bottom: 20px;
                    color: #ef4444;
                    font-size: 0.85rem;
                }
                .section {
                    margin-bottom: 20px;
                }
                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin: 0 0 12px;
                }
                .weapons-list, .tasks-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .ammo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 10px;
                }
            `}</style>
        </div>
    );
}
