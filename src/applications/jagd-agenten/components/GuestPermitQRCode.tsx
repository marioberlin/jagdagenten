/**
 * GuestPermitQRCode
 *
 * QR code generator for digital Begehungsscheine (guest permits).
 * Embeds permit data in a scannable QR code for quick verification.
 */

import { useEffect, useRef, useState } from 'react';
import { QrCode, Download, Share2, Copy, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuestPermit {
    id: string;
    guestName: string;
    hostName?: string;
    revier: string;
    validFrom: string;
    validUntil: string;
    species?: string[];
    conditions?: Record<string, unknown>;
}

interface GuestPermitQRCodeProps {
    permit: GuestPermit;
    size?: number;
    showActions?: boolean;
}

// ---------------------------------------------------------------------------
// QR Code Generation (using Canvas)
// ---------------------------------------------------------------------------

/**
 * Simple QR code generator using a public API
 * For production, use a library like 'qrcode' or 'qr-code-styling'
 */
function generateQRDataUrl(data: string, size: number): string {
    // Using Google Charts API as fallback (note: consider self-hosting for privacy)
    const encoded = encodeURIComponent(data);
    return `https://quickchart.io/qr?text=${encoded}&size=${size}&dark=22c55e&light=1a1a1a`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function createPermitUrl(permit: GuestPermit): string {
    // Create a verification URL that can be scanned
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/verify/permit/${permit.id}`;
}

function createPermitData(permit: GuestPermit): string {
    // Embed essential permit info in compact format
    const data = {
        t: 'JBG', // Type: Jagd Begehungsschein
        id: permit.id,
        g: permit.guestName,
        r: permit.revier,
        f: permit.validFrom,
        u: permit.validUntil,
    };
    return JSON.stringify(data);
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function GuestPermitQRCode({
    permit,
    size = 200,
    showActions = true,
}: GuestPermitQRCodeProps) {
    const [qrUrl, setQrUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const data = createPermitData(permit);
        setQrUrl(generateQRDataUrl(data, size));
    }, [permit, size]);

    const handleDownload = async () => {
        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `begehungsschein-${permit.guestName.toLowerCase().replace(/\s/g, '-')}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
    };

    const handleShare = async () => {
        const verifyUrl = createPermitUrl(permit);

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Begehungsschein für ${permit.guestName}`,
                    text: `Gasterlaubnis für ${permit.revier}, gültig ${formatDate(permit.validFrom)} - ${formatDate(permit.validUntil)}`,
                    url: verifyUrl,
                });
            } catch {
                // User cancelled or not supported
            }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(verifyUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyLink = async () => {
        const verifyUrl = createPermitUrl(permit);
        await navigator.clipboard.writeText(verifyUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isExpired = new Date(permit.validUntil) < new Date();
    const isNotYetValid = new Date(permit.validFrom) > new Date();

    return (
        <div className="flex flex-col items-center gap-4">
            {/* QR Code */}
            <div
                className={`
                    p-4 rounded-xl bg-[#1a1a1a] border-2
                    ${isExpired ? 'border-red-500/50 opacity-50' : 'border-green-500/30'}
                `}
            >
                {qrUrl ? (
                    <img
                        src={qrUrl}
                        alt="QR Code"
                        width={size}
                        height={size}
                        className="rounded-lg"
                    />
                ) : (
                    <div
                        className="flex items-center justify-center bg-[var(--glass-surface)] rounded-lg"
                        style={{ width: size, height: size }}
                    >
                        <QrCode size={48} className="text-gray-600" />
                    </div>
                )}
            </div>

            {/* Status Badge */}
            {isExpired && (
                <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-medium">
                    Abgelaufen
                </div>
            )}
            {isNotYetValid && (
                <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
                    Noch nicht gültig
                </div>
            )}

            {/* Permit Info */}
            <div className="text-center space-y-1">
                <p className="font-medium text-[var(--text-primary)]">
                    {permit.guestName}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                    {permit.revier}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                    {formatDate(permit.validFrom)} – {formatDate(permit.validUntil)}
                </p>
            </div>

            {/* Action Buttons */}
            {showActions && !isExpired && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)] transition-colors"
                        title="Herunterladen"
                    >
                        <Download size={18} className="text-[var(--text-secondary)]" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)] transition-colors"
                        title="Teilen"
                    >
                        <Share2 size={18} className="text-[var(--text-secondary)]" />
                    </button>
                    <button
                        onClick={handleCopyLink}
                        className="p-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)] transition-colors"
                        title="Link kopieren"
                    >
                        {copied ? (
                            <Check size={18} className="text-green-400" />
                        ) : (
                            <Copy size={18} className="text-[var(--text-secondary)]" />
                        )}
                    </button>
                </div>
            )}

            {/* Hidden canvas for future local generation */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

export default GuestPermitQRCode;
