/**
 * ConfidenceSlider Component
 *
 * 5-level confidence selector for sighting certainty.
 */
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfidenceSliderProps {
    value: number;
    onChange: (value: number) => void;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CONFIDENCE_LEVELS = [
    { value: 1, label: 'Sehr unsicher', emoji: '🤷', color: '#ef4444' },
    { value: 2, label: 'Unsicher', emoji: '🤔', color: '#f97316' },
    { value: 3, label: 'Möglich', emoji: '👀', color: '#f59e0b' },
    { value: 4, label: 'Wahrscheinlich', emoji: '👍', color: '#84cc16' },
    { value: 5, label: 'Sicher', emoji: '✅', color: '#10b981' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
    const currentLevel = CONFIDENCE_LEVELS.find((l) => l.value === value) || CONFIDENCE_LEVELS[2];

    return (
        <div className="confidence-slider">
            <div className="slider-track">
                {CONFIDENCE_LEVELS.map((level) => (
                    <button
                        key={level.value}
                        type="button"
                        className={`slider-step ${level.value === value ? 'active' : ''}`}
                        onClick={() => onChange(level.value)}
                        title={level.label}
                        style={{
                            backgroundColor: level.value === value ? level.color : undefined,
                            borderColor: level.color,
                        }}
                    >
                        <span className="step-emoji">{level.emoji}</span>
                    </button>
                ))}
            </div>

            <div className="slider-label" style={{ color: currentLevel.color }}>
                {currentLevel.label}
            </div>

            <style>{`
                .confidence-slider {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .slider-track {
                    display: flex;
                    gap: 8px;
                    justify-content: space-between;
                }

                .slider-step {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 12px 8px;
                    background: var(--glass-surface);
                    border: 2px solid var(--glass-border);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .slider-step:hover {
                    transform: scale(1.05);
                }

                .slider-step.active {
                    color: white;
                    border-width: 2px;
                }

                .step-emoji {
                    font-size: 1.25rem;
                }

                .slider-label {
                    text-align: center;
                    font-size: 0.875rem;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}
