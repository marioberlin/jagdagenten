/**
 * PrivateHuntModeToggle Component
 *
 * Toggle to enable "Ghost Mode" - completely private hunt with no data sharing.
 */

import { useState } from 'react';
import { Ghost, Shield, Eye, EyeOff, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PrivateHuntModeToggleProps {
    initialValue?: boolean;
    onChange?: (isPrivate: boolean) => void;
    showDetails?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PrivateHuntModeToggle({
    initialValue = false,
    onChange,
    showDetails = true,
}: PrivateHuntModeToggleProps) {
    const [isPrivate, setIsPrivate] = useState(initialValue);
    const [showInfo, setShowInfo] = useState(false);

    const handleToggle = () => {
        const newValue = !isPrivate;
        setIsPrivate(newValue);
        onChange?.(newValue);
    };

    return (
        <div className="private-hunt-toggle">
            {/* Main toggle */}
            <div className="toggle-row">
                <button
                    onClick={handleToggle}
                    className={`toggle-btn ${isPrivate ? 'active' : ''}`}
                    aria-pressed={isPrivate}
                >
                    <div className="toggle-icon">
                        {isPrivate ? <Ghost className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </div>
                    <div className="toggle-content">
                        <span className="toggle-label">
                            {isPrivate ? 'Geistermodus aktiv' : 'Normale Jagd'}
                        </span>
                        <span className="toggle-desc">
                            {isPrivate
                                ? 'Keine Daten werden geteilt'
                                : 'Anonymisierte Beiträge erlaubt'}
                        </span>
                    </div>
                    <div className="toggle-switch">
                        <div className={`switch-track ${isPrivate ? 'on' : ''}`}>
                            <div className="switch-thumb" />
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="info-btn"
                    aria-label="Mehr Informationen"
                >
                    <Info className="w-4 h-4" />
                </button>
            </div>

            {/* Details panel */}
            {showDetails && showInfo && (
                <div className="info-panel">
                    <h4>Was bedeutet Geistermodus?</h4>

                    <div className="comparison">
                        <div className="mode-col normal">
                            <div className="mode-header">
                                <Eye className="w-4 h-4" />
                                <span>Normale Jagd</span>
                            </div>
                            <ul>
                                <li>Sichtungen werden anonymisiert geteilt</li>
                                <li>Standort auf 5km gerundet</li>
                                <li>24-72h Zeitverzögerung</li>
                                <li>Beitrag zu Trend-Analysen (k=10)</li>
                            </ul>
                        </div>

                        <div className="mode-col ghost">
                            <div className="mode-header">
                                <Ghost className="w-4 h-4" />
                                <span>Geistermodus</span>
                            </div>
                            <ul>
                                <li>Nichts wird geteilt</li>
                                <li>Nur lokale Speicherung</li>
                                <li>Kein Beitrag zu Statistiken</li>
                                <li>Vollständig offline möglich</li>
                            </ul>
                        </div>
                    </div>

                    <div className="privacy-note">
                        <Shield className="w-4 h-4" />
                        <span>
                            Auch im Normalmodus werden niemals Ihre Identität oder
                            präzise Standorte geteilt.
                        </span>
                    </div>
                </div>
            )}

            {/* Active indicator */}
            {isPrivate && (
                <div className="ghost-active-banner">
                    <EyeOff className="w-4 h-4" />
                    <span>Geistermodus läuft — nichts wird geteilt</span>
                </div>
            )}

            <style>{`
                .private-hunt-toggle {
                    background: var(--glass-surface);
                    border-radius: 12px;
                    padding: 14px;
                }

                .toggle-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .toggle-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    background: transparent;
                    border: 1px solid var(--glass-border);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                }

                .toggle-btn:hover {
                    border-color: var(--glass-accent, #10b981);
                }

                .toggle-btn.active {
                    background: rgba(139, 92, 246, 0.1);
                    border-color: #8b5cf6;
                }

                .toggle-icon {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--glass-bg-regular);
                    border-radius: 8px;
                    color: var(--text-secondary);
                }

                .toggle-btn.active .toggle-icon {
                    background: rgba(139, 92, 246, 0.2);
                    color: #8b5cf6;
                }

                .toggle-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .toggle-label {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }

                .toggle-desc {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }

                .toggle-switch {
                    padding: 4px;
                }

                .switch-track {
                    width: 44px;
                    height: 24px;
                    background: var(--glass-bg-regular);
                    border-radius: 12px;
                    position: relative;
                    transition: background 0.2s;
                }

                .switch-track.on {
                    background: #8b5cf6;
                }

                .switch-thumb {
                    width: 20px;
                    height: 20px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    transition: transform 0.2s;
                }

                .switch-track.on .switch-thumb {
                    transform: translateX(20px);
                }

                .info-btn {
                    padding: 10px;
                    background: var(--glass-bg-regular);
                    border: none;
                    border-radius: 8px;
                    color: var(--text-secondary);
                    cursor: pointer;
                }

                .info-panel {
                    margin-top: 14px;
                    padding: 14px;
                    background: var(--glass-bg-regular);
                    border-radius: 10px;
                }

                .info-panel h4 {
                    margin: 0 0 12px;
                    font-size: 0.9rem;
                    color: var(--text-primary);
                }

                .comparison {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .mode-col {
                    padding: 10px;
                    border-radius: 8px;
                }

                .mode-col.normal {
                    background: rgba(16, 185, 129, 0.1);
                }

                .mode-col.ghost {
                    background: rgba(139, 92, 246, 0.1);
                }

                .mode-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 8px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .mode-col.normal .mode-header {
                    color: #10b981;
                }

                .mode-col.ghost .mode-header {
                    color: #8b5cf6;
                }

                .mode-col ul {
                    margin: 0;
                    padding-left: 16px;
                }

                .mode-col li {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }

                .privacy-note {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    padding: 10px;
                    background: rgba(59, 130, 246, 0.1);
                    border-radius: 8px;
                    font-size: 0.75rem;
                    color: #3b82f6;
                }

                .ghost-active-banner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 12px;
                    padding: 10px;
                    background: rgba(139, 92, 246, 0.15);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    color: #8b5cf6;
                }

                @media (max-width: 480px) {
                    .comparison {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
