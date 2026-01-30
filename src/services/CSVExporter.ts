/**
 * CSV Export Service
 *
 * Generates CSV exports for various Jagd-Agenten data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Harvest {
    id: string;
    date: string;
    species: string;
    weight?: number;
    location?: string;
    notes?: string;
}

interface EquipmentItem {
    id: string;
    name: string;
    type: string;
    serialNumber?: string;
    purchaseDate?: string;
    lastMaintenance?: string;
}

interface AmmoRecord {
    id: string;
    caliber: string;
    brand: string;
    quantity: number;
    purchaseDate?: string;
}

// ---------------------------------------------------------------------------
// CSV Generator
// ---------------------------------------------------------------------------

export class CSVExporter {
    private static escapeCSV(value: unknown): string {
        if (value === null || value === undefined) return '';
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    private static arrayToCSV(headers: string[], rows: unknown[][]): string {
        const headerRow = headers.map(this.escapeCSV).join(',');
        const dataRows = rows.map(row =>
            row.map(this.escapeCSV).join(',')
        ).join('\n');

        // Add BOM for Excel compatibility with German characters
        return '\uFEFF' + headerRow + '\n' + dataRows;
    }

    private static download(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ---------------------------------------------------------------------------
    // Streckenliste (Harvest List)
    // ---------------------------------------------------------------------------

    static exportStreckenliste(harvests: Harvest[], revierName: string): void {
        const headers = [
            'Datum',
            'Wildart',
            'Gewicht (kg)',
            'Ort',
            'Bemerkungen',
        ];

        const rows = harvests.map(h => [
            h.date,
            h.species,
            h.weight || '',
            h.location || '',
            h.notes || '',
        ]);

        const csv = this.arrayToCSV(headers, rows);
        const filename = `streckenliste_${revierName}_${new Date().toISOString().split('T')[0]}.csv`;
        this.download(csv, filename);
    }

    // ---------------------------------------------------------------------------
    // Equipment Inventory
    // ---------------------------------------------------------------------------

    static exportEquipment(items: EquipmentItem[]): void {
        const headers = [
            'Name',
            'Typ',
            'Seriennummer',
            'Kaufdatum',
            'Letzte Wartung',
        ];

        const rows = items.map(item => [
            item.name,
            item.type,
            item.serialNumber || '',
            item.purchaseDate || '',
            item.lastMaintenance || '',
        ]);

        const csv = this.arrayToCSV(headers, rows);
        const filename = `ausruestung_${new Date().toISOString().split('T')[0]}.csv`;
        this.download(csv, filename);
    }

    // ---------------------------------------------------------------------------
    // Ammo Ledger
    // ---------------------------------------------------------------------------

    static exportAmmo(records: AmmoRecord[]): void {
        const headers = [
            'Kaliber',
            'Marke',
            'Anzahl',
            'Kaufdatum',
        ];

        const rows = records.map(r => [
            r.caliber,
            r.brand,
            r.quantity,
            r.purchaseDate || '',
        ]);

        const csv = this.arrayToCSV(headers, rows);
        const filename = `munition_${new Date().toISOString().split('T')[0]}.csv`;
        this.download(csv, filename);
    }

    // ---------------------------------------------------------------------------
    // Sessions (Hunt Log)
    // ---------------------------------------------------------------------------

    static exportSessions(sessions: Array<{
        id: string;
        type: string;
        startTime: string;
        endTime?: string;
        stand?: string;
        observations: number;
        harvests: number;
    }>): void {
        const headers = [
            'Datum',
            'Typ',
            'Start',
            'Ende',
            'Stand',
            'Beobachtungen',
            'Erlegungen',
        ];

        const rows = sessions.map(s => {
            const date = new Date(s.startTime);
            return [
                date.toLocaleDateString('de-DE'),
                s.type,
                date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                s.endTime ? new Date(s.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
                s.stand || '',
                s.observations,
                s.harvests,
            ];
        });

        const csv = this.arrayToCSV(headers, rows);
        const filename = `jagdtagebuch_${new Date().toISOString().split('T')[0]}.csv`;
        this.download(csv, filename);
    }

    // ---------------------------------------------------------------------------
    // Drückjagd Participants
    // ---------------------------------------------------------------------------

    static exportDrueckjagdParticipants(
        eventName: string,
        participants: Array<{
            name: string;
            role: string;
            standNumber?: number;
            phone?: string;
            checkedIn: boolean;
        }>
    ): void {
        const headers = [
            'Name',
            'Rolle',
            'Stand-Nr.',
            'Telefon',
            'Eingecheckt',
        ];

        const rows = participants.map(p => [
            p.name,
            p.role,
            p.standNumber || '',
            p.phone || '',
            p.checkedIn ? 'Ja' : 'Nein',
        ]);

        const csv = this.arrayToCSV(headers, rows);
        const sanitizedName = eventName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_');
        const filename = `teilnehmer_${sanitizedName}_${new Date().toISOString().split('T')[0]}.csv`;
        this.download(csv, filename);
    }
}

export default CSVExporter;
