/**
 * Streckenliste Generator
 * 
 * Generates state-specific harvest reports (Streckenliste) as PDF documents.
 * Supports Bavaria, NRW, Lower Saxony, and other German states.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HarvestEntry {
    id: string;
    date: string;          // ISO date
    time: string;          // HH:MM
    species: string;       // Wildart
    gender: 'male' | 'female' | 'unknown';
    ageClass: string;      // Altersklasse (e.g., "IIa", "III")
    weight?: number;       // Aufgebrochen in kg
    location: string;      // Revier/Stand
    hunter: string;        // Erleger (Name)
    weaponCaliber?: string;
    notes?: string;
}

export interface StreckenlierteData {
    revier: string;
    revierNumber?: string;
    jagdpächter: string;   // Tenant/Leaseholder
    jagdgenossenschaft?: string;
    landkreis: string;     // District
    bundesland: GermanState;
    jagdjahr: string;      // e.g., "2025/2026"
    entries: HarvestEntry[];
    generatedAt: string;
}

export type GermanState =
    | 'bayern'
    | 'baden-wuerttemberg'
    | 'niedersachsen'
    | 'nrw'
    | 'hessen'
    | 'rheinland-pfalz'
    | 'schleswig-holstein'
    | 'mecklenburg-vorpommern'
    | 'brandenburg'
    | 'sachsen'
    | 'sachsen-anhalt'
    | 'thueringen'
    | 'saarland'
    | 'berlin'
    | 'bremen'
    | 'hamburg';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: '1pt solid #333',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    metaLabel: {
        width: 120,
        fontWeight: 'bold',
    },
    metaValue: {
        flex: 1,
    },
    table: {
        marginTop: 15,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderBottom: '1pt solid #333',
        padding: 5,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #ccc',
        padding: 5,
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #ccc',
        padding: 5,
        backgroundColor: '#fafafa',
    },
    colDate: { width: '12%' },
    colTime: { width: '8%' },
    colSpecies: { width: '15%' },
    colGender: { width: '8%' },
    colAge: { width: '10%' },
    colWeight: { width: '10%' },
    colLocation: { width: '15%' },
    colHunter: { width: '12%' },
    colNotes: { width: '10%' },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#888',
        borderTop: '0.5pt solid #ccc',
        paddingTop: 10,
    },
    signature: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBlock: {
        width: '45%',
        borderTop: '1pt solid #333',
        paddingTop: 5,
        textAlign: 'center',
        fontSize: 9,
    },
    summary: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 4,
    },
    summaryTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
});

// ---------------------------------------------------------------------------
// State-Specific Headers
// ---------------------------------------------------------------------------

const STATE_HEADERS: Record<GermanState, { title: string; authority: string }> = {
    bayern: {
        title: 'Streckenliste gemäß Art. 34 BayJG',
        authority: 'Bayerisches Staatsministerium für Ernährung, Landwirtschaft und Forsten',
    },
    'baden-wuerttemberg': {
        title: 'Streckenliste gemäß § 37 JWMG',
        authority: 'Ministerium für Ländlichen Raum und Verbraucherschutz Baden-Württemberg',
    },
    niedersachsen: {
        title: 'Streckenliste gemäß § 29 NJagdG',
        authority: 'Niedersächsisches Ministerium für Ernährung, Landwirtschaft und Verbraucherschutz',
    },
    nrw: {
        title: 'Streckenliste gemäß § 27 LJG-NRW',
        authority: 'Ministerium für Umwelt, Landwirtschaft, Natur- und Verbraucherschutz NRW',
    },
    hessen: {
        title: 'Streckenliste gemäß § 34 HJagdG',
        authority: 'Hessisches Ministerium für Umwelt, Klimaschutz, Landwirtschaft und Verbraucherschutz',
    },
    'rheinland-pfalz': {
        title: 'Streckenliste gemäß § 32 LJG',
        authority: 'Ministerium für Klimaschutz, Umwelt, Energie und Mobilität Rheinland-Pfalz',
    },
    'schleswig-holstein': {
        title: 'Streckenliste gemäß § 31 LJagdG',
        authority: 'Ministerium für Energiewende, Klimaschutz und Umwelt Schleswig-Holstein',
    },
    'mecklenburg-vorpommern': {
        title: 'Streckenliste gemäß § 30 LJagdG M-V',
        authority: 'Ministerium für Klimaschutz, Landwirtschaft und Umwelt M-V',
    },
    brandenburg: {
        title: 'Streckenliste gemäß § 32 BbgJagdG',
        authority: 'Ministerium für Landwirtschaft, Umwelt und Klimaschutz Brandenburg',
    },
    sachsen: {
        title: 'Streckenliste gemäß § 30 SächsJagdG',
        authority: 'Sächsisches Staatsministerium für Energie, Klimaschutz und Umwelt',
    },
    'sachsen-anhalt': {
        title: 'Streckenliste gemäß § 32 LJagdG LSA',
        authority: 'Ministerium für Wirtschaft, Tourismus, Landwirtschaft und Forsten Sachsen-Anhalt',
    },
    thueringen: {
        title: 'Streckenliste gemäß § 30 ThJG',
        authority: 'Thüringer Ministerium für Infrastruktur und Landwirtschaft',
    },
    saarland: {
        title: 'Streckenliste gemäß § 29 SJG',
        authority: 'Ministerium für Umwelt, Klima und Verkehr Saarland',
    },
    berlin: {
        title: 'Streckenliste gemäß § 31 LJagdG Bln',
        authority: 'Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt Berlin',
    },
    bremen: {
        title: 'Streckenliste gemäß § 28 BremJagdG',
        authority: 'Senatorin für Umwelt, Klima und Wissenschaft Bremen',
    },
    hamburg: {
        title: 'Streckenliste gemäß § 29 HmbJagdG',
        authority: 'Behörde für Umwelt, Klima, Energie und Agrarwirtschaft Hamburg',
    },
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('de-DE');
}

function formatGender(gender: string): string {
    switch (gender) {
        case 'male': return 'M';
        case 'female': return 'W';
        default: return '?';
    }
}

function calculateSummary(entries: HarvestEntry[]): Record<string, number> {
    return entries.reduce((acc, entry) => {
        acc[entry.species] = (acc[entry.species] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
}

// ---------------------------------------------------------------------------
// PDF Document Component
// ---------------------------------------------------------------------------

interface StreckenlisterPDFProps {
    data: StreckenlierteData;
}

export function StreckenlisterPDF({ data }: StreckenlisterPDFProps) {
    const stateInfo = STATE_HEADERS[data.bundesland];
    const summary = calculateSummary(data.entries);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{stateInfo.title}</Text>
                    <Text style={styles.subtitle}>{stateInfo.authority}</Text>
                </View>

                {/* Metadata */}
                <View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Revier:</Text>
                        <Text style={styles.metaValue}>{data.revier} {data.revierNumber ? `(Nr. ${data.revierNumber})` : ''}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Jagdpächter:</Text>
                        <Text style={styles.metaValue}>{data.jagdpächter}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Landkreis:</Text>
                        <Text style={styles.metaValue}>{data.landkreis}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Jagdjahr:</Text>
                        <Text style={styles.metaValue}>{data.jagdjahr}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.tableHeader}>
                        <Text style={styles.colDate}>Datum</Text>
                        <Text style={styles.colTime}>Uhrzeit</Text>
                        <Text style={styles.colSpecies}>Wildart</Text>
                        <Text style={styles.colGender}>Geschl.</Text>
                        <Text style={styles.colAge}>AK</Text>
                        <Text style={styles.colWeight}>kg</Text>
                        <Text style={styles.colLocation}>Ort</Text>
                        <Text style={styles.colHunter}>Erleger</Text>
                        <Text style={styles.colNotes}>Bem.</Text>
                    </View>

                    {/* Data Rows */}
                    {data.entries.map((entry, idx) => (
                        <View key={entry.id} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                            <Text style={styles.colDate}>{formatDate(entry.date)}</Text>
                            <Text style={styles.colTime}>{entry.time}</Text>
                            <Text style={styles.colSpecies}>{entry.species}</Text>
                            <Text style={styles.colGender}>{formatGender(entry.gender)}</Text>
                            <Text style={styles.colAge}>{entry.ageClass}</Text>
                            <Text style={styles.colWeight}>{entry.weight || '-'}</Text>
                            <Text style={styles.colLocation}>{entry.location}</Text>
                            <Text style={styles.colHunter}>{entry.hunter}</Text>
                            <Text style={styles.colNotes}>{entry.notes || ''}</Text>
                        </View>
                    ))}
                </View>

                {/* Summary */}
                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>Zusammenfassung ({data.entries.length} Stück)</Text>
                    {Object.entries(summary).map(([species, count]) => (
                        <View key={species} style={styles.summaryRow}>
                            <Text style={styles.metaLabel}>{species}:</Text>
                            <Text>{count} Stück</Text>
                        </View>
                    ))}
                </View>

                {/* Signature Blocks */}
                <View style={styles.signature}>
                    <View style={styles.signatureBlock}>
                        <Text>Ort, Datum</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text>Unterschrift Jagdpächter</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Erstellt am {new Date(data.generatedAt).toLocaleString('de-DE')} mit Jagd-Agenten
                </Text>
            </Page>
        </Document>
    );
}

// ---------------------------------------------------------------------------
// Export Function
// ---------------------------------------------------------------------------

export async function generateStreckenliste(data: StreckenlierteData): Promise<Uint8Array> {
    // Dynamic import to avoid SSR issues
    const { pdf } = await import('@react-pdf/renderer');

    const element = React.createElement(StreckenlisterPDF, { data });
    const pdfBlob = await pdf(element).toBlob();

    return new Uint8Array(await pdfBlob.arrayBuffer());
}

export default {
    generateStreckenliste,
    StreckenlisterPDF,
};
