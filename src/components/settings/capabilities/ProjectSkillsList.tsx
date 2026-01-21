/**
 * ProjectSkillsList
 * 
 * Displays skills from the project root - domain expertise that the agent "knows".
 * Uses Book icon motif with blue color theme.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Book, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSkillStore } from '@/stores/skillStore';

interface ProjectSkillsListProps {
    searchQuery?: string;
}

export const ProjectSkillsList: React.FC<ProjectSkillsListProps> = ({ searchQuery = '' }) => {
    const { skills, toggleSkill, isLoading } = useSkillStore();

    const filteredSkills = useMemo(() => {
        if (!searchQuery.trim()) return skills;
        const q = searchQuery.toLowerCase();
        return skills.filter(
            s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );
    }, [skills, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-pulse flex flex-col items-center gap-3">
                    <Book className="w-8 h-8 text-blue-400/50" />
                    <span className="text-sm text-white/40">Loading skills...</span>
                </div>
            </div>
        );
    }

    if (filteredSkills.length === 0) {
        return (
            <div className="text-center py-12 rounded-xl border border-dashed border-white/10 bg-white/5">
                <Book size={32} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/40 text-sm">No project skills found</p>
                <p className="text-white/30 text-xs mt-1">
                    Add skills to your <code className="bg-black/30 px-1 rounded">skills/</code> directory
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-white/50 text-xs uppercase tracking-wider">
                <Book size={14} className="text-blue-400" />
                <span>Project Skills ({filteredSkills.length})</span>
            </div>

            {/* Skills Grid */}
            <div className="grid gap-3">
                {filteredSkills.map((skill) => (
                    <motion.div
                        key={skill.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "group p-4 rounded-xl border transition-all hover:bg-white/5",
                            skill.enabled
                                ? "bg-blue-500/5 border-blue-500/20"
                                : "bg-black/20 border-white/5 opacity-60 hover:opacity-100"
                        )}
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={cn(
                                "p-3 rounded-xl transition-colors",
                                skill.enabled
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-white/5 text-white/40"
                            )}>
                                <Book size={20} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-white">{skill.name}</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border border-blue-500/20 bg-blue-500/10 text-blue-400">
                                        Skill
                                    </span>
                                    {skill.author === 'core' && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                                            Core
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-white/60 line-clamp-2">{skill.description}</p>
                            </div>

                            {/* Toggle */}
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={skill.enabled}
                                    onChange={() => toggleSkill(skill.id, !skill.enabled)}
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>

                        {/* Metadata Row */}
                        {skill.enabled && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs text-white/30">
                                    <Info size={12} />
                                    <span>Domain knowledge active</span>
                                </div>
                                <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                    <span>View Details</span>
                                    <ChevronRight size={12} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
