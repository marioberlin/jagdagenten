/**
 * SightingForm Component
 *
 * Modal form for creating a new sighting with privacy features.
 */

import { useState } from 'react';
import { X, MapPin, AlertTriangle, Shield, Clock } from 'lucide-react';
import ConfidenceSlider from './ConfidenceSlider';
import SpeciesSelector from './SpeciesSelector';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SightingFormProps {
    userId?: string;
    onClose: () => void;
    onCreated: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SightingForm({ userId, onClose, onCreated }: SightingFormProps) {
    // Form state
    const [species, setSpecies] = useState('');
    const [confidence, setConfidence] = useState(3);
    const [description, setDescription] = useState('');
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [bundesland, setBundesland] = useState('');
    const [observedAt, setObservedAt] = useState(
        new Date().toISOString().slice(0, 16)
    );
    const [delayHours, setDelayHours] = useState(48);
    const [photoUrls, _setPhotoUrls] = useState<string[]>([]);

    // UI state
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Get current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Standortbestimmung nicht verfügbar');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLat(pos.coords.latitude);
                setLng(pos.coords.longitude);
                setGettingLocation(false);
            },
            (_err) => {
                setError('Standort konnte nicht ermittelt werden');
                setGettingLocation(false);
            }
        );
    };

    // Submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!species) {
            setError('Bitte Art auswählen');
            return;
        }
        if (lat === null || lng === null) {
            setError('Bitte Standort angeben');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/v1/jagd/sightings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    species,
                    confidence,
                    description: description || undefined,
                    lat,
                    lng,
                    bundesland: bundesland || undefined,
                    observedAt: new Date(observedAt).toISOString(),
                    delayHours,
                    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                onCreated();
            } else {
                setError(data.error || 'Fehler beim Speichern');
            }
        } catch (_err) {
            setError('Verbindungsfehler');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate estimated publish time
    const estimatedPublish = new Date(
        new Date(observedAt).getTime() + delayHours * 60 * 60 * 1000
    );

    return (
        <div className="form-overlay">
            <div className="form-modal">
                {/* Header */}
                <div className="form-header">
                    <h3>Sichtung melden</h3>
                    <button onClick={onClose} className="close-btn">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Privacy notice */}
                <div className="privacy-info">
                    <Shield className="w-4 h-4" />
                    <span>Dein genauer Standort wird nie veröffentlicht. Nur das 5km-Raster wird angezeigt.</span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Species */}
                    <div className="form-group">
                        <label>Art *</label>
                        <SpeciesSelector value={species} onChange={setSpecies} />
                    </div>

                    {/* Confidence */}
                    <div className="form-group">
                        <label>Sicherheit der Beobachtung</label>
                        <ConfidenceSlider value={confidence} onChange={setConfidence} />
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <label>Standort *</label>
                        <div className="location-input">
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={gettingLocation}
                                className="location-btn"
                            >
                                <MapPin className="w-4 h-4" />
                                {gettingLocation
                                    ? 'Ermittle...'
                                    : lat
                                        ? 'Standort aktualisieren'
                                        : 'Aktuellen Standort verwenden'}
                            </button>
                            {lat && lng && (
                                <span className="location-status">
                                    ✓ Standort erfasst (wird auf 5km unscharf)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bundesland */}
                    <div className="form-group">
                        <label>Bundesland</label>
                        <select value={bundesland} onChange={(e) => setBundesland(e.target.value)}>
                            <option value="">Automatisch erkennen</option>
                            <option value="Bayern">Bayern</option>
                            <option value="Baden-Württemberg">Baden-Württemberg</option>
                            <option value="Nordrhein-Westfalen">Nordrhein-Westfalen</option>
                            <option value="Niedersachsen">Niedersachsen</option>
                            <option value="Hessen">Hessen</option>
                            <option value="Brandenburg">Brandenburg</option>
                            <option value="Sachsen">Sachsen</option>
                        </select>
                    </div>

                    {/* Time of observation */}
                    <div className="form-group">
                        <label>Beobachtungszeitpunkt</label>
                        <input
                            type="datetime-local"
                            value={observedAt}
                            onChange={(e) => setObservedAt(e.target.value)}
                        />
                    </div>

                    {/* Delay */}
                    <div className="form-group">
                        <label>
                            <Clock className="w-4 h-4 inline" /> Veröffentlichungsverzögerung
                        </label>
                        <select value={delayHours} onChange={(e) => setDelayHours(Number(e.target.value))}>
                            <option value={24}>24 Stunden</option>
                            <option value={48}>48 Stunden (Standard)</option>
                            <option value={72}>72 Stunden (max. Privatsphäre)</option>
                        </select>
                        <small className="delay-info">
                            Wird veröffentlicht: {estimatedPublish.toLocaleString('de-DE')}
                        </small>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Beschreibung (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Z.B. Verhalten, Rudel, Richtung..."
                            rows={3}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="form-error">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Abbrechen
                        </button>
                        <button type="submit" disabled={submitting} className="submit-btn">
                            {submitting ? 'Speichern...' : 'Sichtung melden'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .form-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .form-modal {
                    background: var(--bg-secondary, #1a1a2e);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 480px;
                    max-height: 90vh;
                    overflow-y: auto;
                }

                .form-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-color, #333);
                }

                .form-header h3 {
                    margin: 0;
                    color: var(--text-primary, #fff);
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary, #aaa);
                    cursor: pointer;
                    padding: 4px;
                }

                .privacy-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 16px 20px;
                    padding: 10px;
                    background: rgba(16, 185, 129, 0.1);
                    border-radius: 8px;
                    font-size: 0.8rem;
                    color: #10b981;
                }

                form {
                    padding: 0 20px 20px;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 0.875rem;
                    color: var(--text-secondary, #aaa);
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 10px 12px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border: 1px solid var(--border-color, #333);
                    border-radius: 8px;
                    color: var(--text-primary, #fff);
                    font-size: 0.9rem;
                }

                .location-input {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .location-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    background: var(--bg-tertiary, #2a2a4a);
                    border: 1px dashed var(--border-color, #333);
                    border-radius: 8px;
                    color: var(--text-primary, #fff);
                    cursor: pointer;
                }

                .location-status {
                    font-size: 0.8rem;
                    color: #10b981;
                }

                .delay-info {
                    display: block;
                    margin-top: 4px;
                    font-size: 0.75rem;
                    color: var(--text-tertiary, #666);
                }

                .form-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px;
                    background: rgba(239, 68, 68, 0.1);
                    border-radius: 8px;
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-bottom: 16px;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }

                .cancel-btn,
                .submit-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 8px;
                    border: none;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                }

                .cancel-btn {
                    background: var(--bg-tertiary, #2a2a4a);
                    color: var(--text-secondary, #aaa);
                }

                .submit-btn {
                    background: var(--color-primary, #10b981);
                    color: white;
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
