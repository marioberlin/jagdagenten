import React, { useState, useRef, useEffect } from 'react';
import { GlassPageHeader } from '../../components/layout/GlassPageHeader';
import { Sparkles, Upload, RefreshCw, Image as ImageIcon, Loader2, Trash2, Pencil } from 'lucide-react';
import { useOptionalLiquidClient } from '../../liquid-engine/react';
import { GeminiProxyService } from '../../services/proxy/gemini';
import { addDynamicBackground } from '../../components/Backgrounds/BackgroundRegistry';

interface AIWallpaperGeneratorProps {
    onSelectBackground: (id: string, theme: 'light' | 'dark') => void;
}

interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    date: number;
}

export const AIWallpaperGenerator: React.FC<AIWallpaperGeneratorProps> = ({ onSelectBackground }) => {
    const client = useOptionalLiquidClient();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [imageSize, setImageSize] = useState('1K');
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [generatedHistory, setGeneratedHistory] = useState<GeneratedImage[]>([]);
    const [geminiService, setGeminiService] = useState<GeminiProxyService | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Quick prompt templates
    const templates = [
        "A futuristic glass city with neon lights, cyberpunk style",
        "A serene japanese garden with cherry blossoms, digital art",
        "Abstract liquid metal flowing, iridescent colors, macro photography",
        "Minimalist geometric shapes, soft pastel colors, bauhaus style"
    ];

    // Initialize Service - use proxy service to avoid exposing API keys
    useEffect(() => {
        console.log("AIWallpaperGenerator Mounted");

        // If no Liquid Context is available, we use a mock client
        const targetClient = client || ({
            getActions: () => [],
            buildContextPrompt: () => "",
            ingest: () => { },
            executeAction: async () => ({})
        } as any);

        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        console.log("Initializing Gemini Proxy Service", { baseUrl, usingMockClient: !client });
        setGeminiService(new GeminiProxyService(targetClient, baseUrl));

        // Load history
        const savedHistory = localStorage.getItem('ai_wallpaper_history');
        if (savedHistory) {
            try {
                setGeneratedHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, [client]);

    const handleGenerate = async () => {
        if (!prompt.trim() || !geminiService) return;

        setIsGenerating(true);
        setError(null);

        try {
            const resultImages = await geminiService.generateImage(prompt, {
                aspectRatio,
                imageSize,
                referenceImages: referenceImage ? [referenceImage] : undefined
            });

            if (resultImages && resultImages.length > 0) {
                const newImage: GeneratedImage = {
                    id: `gen-${Date.now()}`,
                    url: resultImages[0], // Base64 url
                    prompt: prompt,
                    date: Date.now()
                };

                const newHistory = [newImage, ...generatedHistory];
                setGeneratedHistory(newHistory);
                localStorage.setItem('ai_wallpaper_history', JSON.stringify(newHistory));
            }
        } catch (err: any) {
            setError(err.message || "Failed to generate image. Please try again.");
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReferenceImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUseAsWallpaper = (img: GeneratedImage) => {
        // Register the generated image as a valid background option
        addDynamicBackground({
            id: img.id,
            type: 'image',
            name: img.prompt.slice(0, 20) + '...',
            src: img.url,
            preferredTheme: 'dark' // Default to dark for high contrast AI art
        });

        onSelectBackground(img.id, 'dark');
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this generation?')) {
            const newHistory = generatedHistory.filter(img => img.id !== id);
            setGeneratedHistory(newHistory);
            localStorage.setItem('ai_wallpaper_history', JSON.stringify(newHistory));
        }
    };

    const handleEditPrompt = (text: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPrompt(text);
        // We don't verify if they want to keep the reference image, but typically just editing text is safer.
    };

    if (!geminiService) {
        return (
            <div className="p-8 text-center bg-red-500/20 border border-red-500 text-red-100 rounded-xl m-4">
                <p className="font-bold text-lg">Configuration Required</p>
                <div className="text-sm mt-2 space-y-2 opacity-75">
                    <p>• Missing VITE_GEMINI_API_KEY in .env file.</p>
                </div>
                <p className="text-xs mt-4">Please check console for details.</p>
            </div>
        );
    }



    return (
        <div className="space-y-6">
            <GlassPageHeader title="AI Wallpaper Generator" subtitle=" Create custom wallpapers using Gemini 3 Pro." />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-900/60 backdrop-blur-xl border border-white/10 p-6 space-y-6 shadow-2xl">
                        <div>
                            <h3 className="text-lg font-semibold text-label-glass-primary mb-2 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-accent" />
                                Generator
                            </h3>
                            <p className="text-sm text-label-glass-secondary">
                                Create custom wallpapers using Gemini 3 Pro.
                            </p>
                        </div>

                        {/* Prompt Input */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-label-glass-secondary tracking-wider">Prompt</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your imagination..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent/50 min-h-[100px] resize-none transition-colors"
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {templates.map((t, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(t)}
                                        className="text-[10px] px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/5 transition-colors text-left truncate max-w-full"
                                    >
                                        {t.slice(0, 30)}...
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Reference Image (Img2Img) */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-label-glass-secondary tracking-wider">Reference Image (Optional)</label>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${referenceImage ? 'border-accent/50 bg-accent/5' : 'border-white/10 hover:border-white/20 bg-black/20'}`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    className="hidden"
                                />

                                {referenceImage ? (
                                    <div className="relative group">
                                        <img src={referenceImage} alt="Reference" className="w-full h-32 object-cover rounded-lg" />
                                        <button
                                            onClick={() => setReferenceImage(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center py-6 cursor-pointer text-label-glass-secondary hover:text-label-glass-primary"
                                    >
                                        <Upload className="w-8 h-8 mb-2 opacity-50" />
                                        <span className="text-xs text-center">Click to upload or drag image</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-label-glass-secondary tracking-wider">Ratio</label>
                                <select
                                    value={aspectRatio}
                                    onChange={(e) => setAspectRatio(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                                >
                                    <option value="16:9">16:9 (Desktop)</option>
                                    <option value="9:16">9:16 (Mobile)</option>
                                    <option value="1:1">1:1 (Square)</option>
                                    <option value="4:3">4:3</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-label-glass-secondary tracking-wider">Quality</label>
                                <select
                                    value={imageSize}
                                    onChange={(e) => setImageSize(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                                >
                                    <option value="1K">Standard (1K)</option>
                                    <option value="2K">High (2K)</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-200">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                            ${isGenerating || !prompt.trim()
                                    ? 'bg-gray-800 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-accent to-purple-600 hover:scale-[1.02] hover:shadow-accent/25'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Dreaming...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Generate Wallpaper
                                </>
                            )}
                        </button>

                    </div>
                </div>

                {/* Gallery Section */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {generatedHistory.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center h-full text-label-glass-secondary opacity-50 border-2 border-dashed border-white/5 rounded-2xl">
                                <ImageIcon className="w-12 h-12 mb-4" />
                                <p>No generated wallpapers yet.</p>
                                <p className="text-sm">Start by entering a prompt!</p>
                            </div>
                        ) : (
                            generatedHistory.map((img) => (
                                <div key={img.id} className="group relative aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 hover:border-accent/50 transition-all">
                                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => handleDelete(img.id, e)}
                                                className="p-2 bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div>
                                            <p className="text-white text-xs line-clamp-2 mb-3 font-medium">{img.prompt}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUseAsWallpaper(img)}
                                                    className="flex-1 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    Set
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReferenceImage(img.url);
                                                        setPrompt(img.prompt);
                                                    }}
                                                    className="px-2 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 backdrop-blur-md transition-colors"
                                                    title="Remix (Use as Reference)"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleEditPrompt(img.prompt, e)}
                                                    className="px-2 py-1.5 bg-white/20 text-white text-xs font-bold rounded-lg hover:bg-white/30 backdrop-blur-md transition-colors"
                                                    title="Edit Prompt"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
