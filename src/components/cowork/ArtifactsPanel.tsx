/**
 * ArtifactsPanel
 *
 * Display generated files and outputs in the right sidebar.
 */

import React from 'react';
import {
    FileText,
    Table,
    Image,
    Code,
    Folder,
    FileOutput,
    Eye,
    Download
} from 'lucide-react';

import { formatFileSize } from '@/stores/coworkStore';
import type { CoworkArtifact, ArtifactType } from '@/types/cowork';

interface ArtifactsPanelProps {
    artifacts: CoworkArtifact[];
}

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ artifacts }) => {
    return (
        <div className="flex-1 p-4 border-b border-white/10">
            <h3 className="text-sm font-medium text-white/70 mb-4">
                Artifacts
            </h3>

            {artifacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileOutput size={32} className="text-white/20 mb-2" />
                    <p className="text-sm text-white/40">
                        Outputs created during the task will appear here
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {artifacts.map((artifact) => (
                        <ArtifactCard key={artifact.id} artifact={artifact} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface ArtifactCardProps {
    artifact: CoworkArtifact;
}

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact }) => {
    const typeIcons: Record<ArtifactType, React.ElementType> = {
        file: FileText,
        document: FileText,
        spreadsheet: Table,
        presentation: FileText,
        image: Image,
        code: Code,
        data: Table,
        report: FileText,
        folder: Folder
    };

    const Icon = typeIcons[artifact.type] || FileText;

    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5
                        hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">
                <Icon size={16} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm text-white/90 truncate">
                    {artifact.name}
                </div>
                {artifact.size && (
                    <div className="text-xs text-white/40">
                        {formatFileSize(artifact.size)}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100
                            transition-opacity">
                <button
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    type="button"
                    title="Preview"
                >
                    <Eye size={14} className="text-white/60" />
                </button>
                <button
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    type="button"
                    title="Download"
                >
                    <Download size={14} className="text-white/60" />
                </button>
            </div>
        </div>
    );
};

export default ArtifactsPanel;
