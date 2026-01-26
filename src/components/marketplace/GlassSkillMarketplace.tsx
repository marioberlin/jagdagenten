/**
 * Glass Skill Marketplace
 * 
 * Browse, search, install, and publish AI skills.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './GlassSkillMarketplace.css';

// ============================================================================
// Types
// ============================================================================

interface SkillAuthor {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
}

interface SkillStats {
    stars: number;
    downloads: number;
    usages: number;
    rating: number;
    ratingCount: number;
    comments: number;
}

interface Skill {
    id: string;
    name: string;
    displayName: string;
    description: string;
    version: string;
    category: string;
    tags: string[];
    author: SkillAuthor;
    stats: SkillStats;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

type SortOption = 'popular' | 'recent' | 'stars' | 'downloads';

const CATEGORIES = [
    { id: 'all', name: 'All', icon: '📦' },
    { id: 'automation', name: 'Automation', icon: '⚡' },
    { id: 'data', name: 'Data', icon: '📊' },
    { id: 'coding', name: 'Coding', icon: '💻' },
    { id: 'research', name: 'Research', icon: '🔍' },
    { id: 'communication', name: 'Communication', icon: '💬' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'productivity', name: 'Productivity', icon: '📋' },
    { id: 'integration', name: 'Integration', icon: '🔗' },
];

// ============================================================================
// Component
// ============================================================================

export const GlassSkillMarketplace: React.FC = () => {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState<SortOption>('popular');
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [starredSkills, setStarredSkills] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadSkills();
    }, [selectedCategory, sortBy]);

    const loadSkills = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                sortBy,
                limit: '50',
            });
            if (selectedCategory !== 'all') {
                params.set('category', selectedCategory);
            }
            if (searchQuery) {
                params.set('q', searchQuery);
            }

            const res = await fetch(`/api/v1/marketplace/skills?${params}`);
            if (res.ok) {
                const data = await res.json();
                setSkills(data.skills);
            }
        } catch (err) {
            console.error('Failed to load skills:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, sortBy, searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadSkills();
    };

    const handleInstall = async (skill: Skill) => {
        try {
            setInstallingId(skill.id);
            const res = await fetch(`/api/v1/marketplace/skills/${skill.id}/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerType: 'app',
                    ownerId: 'current-app', // Would come from context
                }),
            });

            if (res.ok) {
                // Show success
                alert(`${skill.displayName} installed successfully!`);
            } else {
                const data = await res.json();
                alert(`Install failed: ${data.error}`);
            }
        } catch (err) {
            alert('Network error. Please try again.');
        } finally {
            setInstallingId(null);
        }
    };

    const handleStar = async (skill: Skill) => {
        const isStarred = starredSkills.has(skill.id);

        try {
            const res = await fetch(`/api/v1/marketplace/skills/${skill.id}/star`, {
                method: isStarred ? 'DELETE' : 'POST',
            });

            if (res.ok) {
                setStarredSkills(prev => {
                    const next = new Set(prev);
                    if (isStarred) {
                        next.delete(skill.id);
                    } else {
                        next.add(skill.id);
                    }
                    return next;
                });
                // Update skill stats locally
                setSkills(prev => prev.map(s =>
                    s.id === skill.id
                        ? { ...s, stats: { ...s.stats, stars: s.stats.stars + (isStarred ? -1 : 1) } }
                        : s
                ));
            }
        } catch (err) {
            console.error('Failed to star skill:', err);
        }
    };

    const formatNumber = (n: number): string => {
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
        return n.toString();
    };

    const renderStars = (rating: number): string => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        const empty = 5 - full - half;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
    };

    return (
        <div className="glass-skill-marketplace">
            {/* Header */}
            <div className="marketplace-header">
                <h1>✨ Skill Marketplace</h1>
                <p>Discover and install AI skills for your agents</p>
            </div>

            {/* Search & Filters */}
            <div className="marketplace-filters">
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <button type="submit">🔍</button>
                </form>

                <div className="sort-options">
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}>
                        <option value="popular">Popular</option>
                        <option value="recent">Recent</option>
                        <option value="stars">Most Stars</option>
                        <option value="downloads">Most Downloads</option>
                    </select>
                </div>
            </div>

            {/* Categories */}
            <div className="category-tabs">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        <span className="cat-icon">{cat.icon}</span>
                        <span className="cat-name">{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Skills Grid */}
            <div className="skills-grid">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner" />
                        <p>Loading skills...</p>
                    </div>
                ) : skills.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>No skills found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    skills.map(skill => (
                        <div
                            key={skill.id}
                            className="skill-card"
                            onClick={() => setSelectedSkill(skill)}
                        >
                            <div className="skill-header">
                                <div className="skill-icon">
                                    {CATEGORIES.find(c => c.id === skill.category)?.icon || '📦'}
                                </div>
                                <div className="skill-meta">
                                    <h3>{skill.displayName}</h3>
                                    <span className="skill-author">by {skill.author.username}</span>
                                </div>
                                {skill.isVerified && <span className="verified-badge">✓</span>}
                            </div>

                            <p className="skill-description">{skill.description}</p>

                            <div className="skill-tags">
                                {skill.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                                {skill.tags.length > 3 && (
                                    <span className="tag more">+{skill.tags.length - 3}</span>
                                )}
                            </div>

                            <div className="skill-footer">
                                <div className="skill-stats">
                                    <span className="stat" title="Stars">
                                        ⭐ {formatNumber(skill.stats.stars)}
                                    </span>
                                    <span className="stat" title="Downloads">
                                        ⬇️ {formatNumber(skill.stats.downloads)}
                                    </span>
                                    {skill.stats.rating > 0 && (
                                        <span className="stat rating" title="Rating">
                                            {skill.stats.rating.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                                <span className="skill-version">v{skill.version}</span>
                            </div>

                            <div className="skill-actions" onClick={e => e.stopPropagation()}>
                                <button
                                    className={`star-btn ${starredSkills.has(skill.id) ? 'starred' : ''}`}
                                    onClick={() => handleStar(skill)}
                                >
                                    {starredSkills.has(skill.id) ? '★' : '☆'}
                                </button>
                                <button
                                    className="install-btn"
                                    onClick={() => handleInstall(skill)}
                                    disabled={installingId === skill.id}
                                >
                                    {installingId === skill.id ? '...' : 'Install'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Skill Detail Modal */}
            {selectedSkill && (
                <div className="skill-modal-overlay" onClick={() => setSelectedSkill(null)}>
                    <div className="skill-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedSkill(null)}>×</button>

                        <div className="modal-header">
                            <div className="skill-icon large">
                                {CATEGORIES.find(c => c.id === selectedSkill.category)?.icon || '📦'}
                            </div>
                            <div className="skill-info">
                                <h2>
                                    {selectedSkill.displayName}
                                    {selectedSkill.isVerified && <span className="verified-badge">✓</span>}
                                </h2>
                                <p className="author">by {selectedSkill.author.displayName || selectedSkill.author.username}</p>
                                <div className="stats-row">
                                    <span>⭐ {formatNumber(selectedSkill.stats.stars)}</span>
                                    <span>⬇️ {formatNumber(selectedSkill.stats.downloads)}</span>
                                    <span>{renderStars(selectedSkill.stats.rating)} ({selectedSkill.stats.ratingCount})</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-body">
                            <p className="description">{selectedSkill.description}</p>

                            <div className="section">
                                <h4>Tags</h4>
                                <div className="tags">
                                    {selectedSkill.tags.map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="section">
                                <h4>Version</h4>
                                <p>{selectedSkill.version}</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className={`star-btn large ${starredSkills.has(selectedSkill.id) ? 'starred' : ''}`}
                                onClick={() => handleStar(selectedSkill)}
                            >
                                {starredSkills.has(selectedSkill.id) ? '★ Starred' : '☆ Star'}
                            </button>
                            <button
                                className="install-btn large"
                                onClick={() => handleInstall(selectedSkill)}
                                disabled={installingId === selectedSkill.id}
                            >
                                {installingId === selectedSkill.id ? 'Installing...' : 'Install Skill'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlassSkillMarketplace;
