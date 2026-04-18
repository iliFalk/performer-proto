import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  Settings, 
  ChevronDown, 
  FileText, 
  AlertCircle, 
  Save, 
  Share, 
  ArrowLeft, 
  LayoutTemplate, 
  Plus, 
  X, 
  Eye, 
  Brain,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  revealVariants, 
  pulseVariants, 
  floatVariants, 
  hologramRowsVariants, 
  connectedTransition,
  getStaggerChildren
} from './lib/animations';
import { getObsidianBridge, ObsidianNote } from './lib/obsidian';
import { App as ObsidianApp } from 'obsidian';

/**
 * Custom hook to handle long-press interaction (Teil 5.3)
 * Right-Click (Mouse) or 500ms Long-Press (Touch) triggers the callback.
 */
function useLongPress(callback: () => void, ms = 500) {
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

    const start = useCallback(() => {
        const id = setTimeout(callback, ms);
        setTimer(id);
    }, [callback, ms]);

    const stop = useCallback(() => {
        if (timer) clearTimeout(timer);
        setTimer(null);
    }, [timer]);

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: stop,
        onTouchStart: start,
        onTouchEnd: stop,
        onContextMenu: (e: React.MouseEvent) => {
            e.preventDefault();
            callback();
        },
    };
}

/**
 * 6.3 Spezifische Animationen — Arc Reactor Pulse
 */
const ArcReactorPulse = ({ active }: { active: boolean }) => {
    if (!active) return null;
    return (
        <div className="relative flex items-center justify-center w-24 h-24">
            {[0, 1, 2, 3].map(i => (
                <div 
                    key={i}
                    className="animate-reactor-pulse"
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        animationDelay: `${i * 500}ms` 
                    }}
                />
            ))}
            <div className="relative z-10 w-8 h-8 rounded-full bg-arc-primary shadow-arc-glow-active" />
        </div>
    );
};

/**
 * 6.3 Spezifische Animationen — Data Rain
 */
const DataRain = () => {
    const [particles, setParticles] = useState<{ id: number; left: string; duration: string; delay: string }[]>([]);
    
    useEffect(() => {
        // Use ResizeObserver or just a simple check for desktop
        const isDesktop = window.innerWidth >= 1024;
        if (!isDesktop) return;
        
        const count = 30;
        const newParticles = Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            duration: `${4 + Math.random() * 6}s`,
            delay: `${Math.random() * 10}s`
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none layer-0 overflow-hidden hide-mobile">
            {particles.map(p => (
                <div 
                    key={p.id}
                    className="data-rain-particle"
                    style={{ 
                        left: p.left, 
                        animationDuration: p.duration, 
                        animationDelay: p.delay 
                    }}
                />
            ))}
        </div>
    );
};

// ============================================================
// TYPES & CONSTANTS
// ============================================================

interface Field {
    name: string;
    prompt: string;
}

interface Template {
    id: string;
    name: string;
    noteNamePrompt: string;
    fields: Field[];
    bodyPrompt: string;
}

interface SettingsState {
    openRouterApiKey: string;
    models: string[];
    templates: Template[];
    glassEffect: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
    openRouterApiKey: '',
    models: ['google/gemini-2.0-flash-exp', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
    glassEffect: true,
    templates: [
        {
            id: 'raw',
            name: 'raw',
            noteNamePrompt: 'Suggest a concise, descriptive note title based on the content.',
            fields: [
                { name: 'title', prompt: 'Extract or generate a clear title for this note.' },
                { name: 'author', prompt: 'Identify the author if mentioned, otherwise leave empty.' },
                { name: 'type', prompt: 'Classify the note type: article, note, meeting, book, idea, reference.' },
                { name: 'tags', prompt: 'Assign exactly ONE tag that best describes the note content.' }
            ],
            bodyPrompt: 'Clean up the note body: fix formatting, remove artifacts, improve structure.'
        },
        {
            id: 'meeting',
            name: 'meeting',
            noteNamePrompt: 'Generate a meeting note title with date: "YYYY-MM-DD Meeting with [participants]".',
            fields: [
                { name: 'title', prompt: 'Create a meeting title with date and participants.' },
                { name: 'date', prompt: 'Extract the meeting date in YYYY-MM-DD format.' },
                { name: 'participants', prompt: 'List all meeting participants as comma-separated values.' },
                { name: 'type', prompt: 'Always set to "meeting".' },
                { name: 'tags', prompt: 'Assign ONE relevant tag from: project, standup, review, planning, retro.' }
            ],
            bodyPrompt: 'Restructure the meeting notes into: Agenda, Discussion, Action Items, Decisions.'
        },
        {
            id: 'book',
            name: 'book',
            noteNamePrompt: 'Generate a book note title: "Book: [Title] by [Author]".',
            fields: [
                { name: 'title', prompt: 'Extract the book title.' },
                { name: 'author', prompt: 'Extract the book author.' },
                { name: 'type', prompt: 'Always set to "book".' },
                { name: 'tags', prompt: 'Assign ONE genre tag: fiction, non-fiction, biography, sci-fi, self-help, philosophy.' },
                { name: 'rating', prompt: 'If a rating is mentioned, extract it (1-5). Otherwise leave empty.' }
            ],
            bodyPrompt: 'Organize the book notes into: Summary, Key Takeaways, Quotes, Personal Notes.'
        }
    ]
};

const SAMPLE_NOTE = {
    frontmatter: {
        title: '',
        author: '',
        type: '',
        tags: ''
    },
    body: `# Productivity Tips for Remote Workers

Working from home has become the new normal for many of us. Here are some practical tips that have helped me stay productive over the past year.

## Morning Routine
Start your day with a consistent routine. I begin with a 15-minute walk, then review my tasks for the day. The key is to start before checking email.

## Deep Work Blocks
Schedule 90-minute blocks of uninterrupted focus time. Turn off notifications and close unnecessary tabs. I use the Pomodoro technique for shorter tasks.

## Workspace Setup
Invest in a good chair and proper lighting. Keep your workspace separate from relaxation areas if possible.

## Key Takeaway
The most important thing is to be intentional about your time. Plan your day, protect your focus hours, and don't forget to take breaks.`
};

// ============================================================
// MAIN APPLICATION COMPONENT
// ============================================================

interface AppProps {
    app?: ObsidianApp;
    plugin?: any;
}

export default function App({ app, plugin }: AppProps) {
    const bridge = getObsidianBridge(app, plugin);

    // Persistence
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    
    // Initial Load from Bridge
    useEffect(() => {
        const load = async () => {
            const saved = await bridge.getSettings();
            if (saved) {
                setSettings(prev => ({
                    ...prev,
                    ...saved,
                    // Merge templates to ensure defaults are there if empty
                    templates: saved.templates?.length ? saved.templates : DEFAULT_SETTINGS.templates
                }));
            }
        };
        load();
    }, []);

    useEffect(() => {
        bridge.saveSettings(settings);
    }, [settings]);

    // View State
    const [view, setView] = useState<'performer' | 'settings'>('performer');
    
    // Note State
    const [activeNote, setActiveNote] = useState<ObsidianNote | null>(null);

    // Sync active note on mount or view change
    const syncNote = useCallback(async () => {
        const note = await bridge.getActiveNote();
        setActiveNote(note);
    }, [bridge]);

    useEffect(() => {
        syncNote();
        // Listener for active file change in Obsidian
        if (app) {
           const ref = app.workspace.on('active-leaf-change', () => syncNote());
           return () => app.workspace.offref(ref);
        }
    }, [app, syncNote]);
    
    // Performer State
    const [currentTemplateId, setCurrentTemplateId] = useState(settings.templates[0].id);
    const [selectedModel, setSelectedModel] = useState(settings.models[0]);
    const [llmResults, setLlmResults] = useState<any>(null);
    const [isPerforming, setIsPerforming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);
    const [fmCollapsed, setFmCollapsed] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isApiKeyEditing, setIsApiKeyEditing] = useState(false);
    const [isRenamingTemplate, setIsRenamingTemplate] = useState<string | null>(null);
    const [isAddingTemplate, setIsAddingTemplate] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [isAddingModel, setIsAddingModel] = useState(false);
    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [isFetchingModels, setIsFetchingModels] = useState(false);
    const [modelSearch, setModelSearch] = useState('');

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentTemplate = settings.templates.find(t => t.id === currentTemplateId) || settings.templates[0];

    // Actions
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const perform = async () => {
        if (isPerforming) return;
        if (!settings.openRouterApiKey) {
            setError('No API key configured. Open Settings → LLM to add your OpenRouter API key.');
            return;
        }

        setIsPerforming(true);
        setLlmResults(null);
        setError(null);
        setTimer(0);
        setIsSaved(false);

        const start = performance.now();
        timerRef.current = setInterval(() => {
            setTimer(performance.now() - start);
        }, 47);

        const systemPrompt = `You are a note interpretation assistant. Analyze the provided note and extract/assign values for the following fields.

Respond ONLY with a valid JSON object. Keys:
${currentTemplate.fields.map(f => `- "${f.name}": ${f.prompt}`).join('\n')}
${currentTemplate.bodyPrompt ? `- "body": ${currentTemplate.bodyPrompt}` : ''}

Additionally, suggest a note name based on this prompt: "${currentTemplate.noteNamePrompt}"
Add the suggested name as a "_noteName" key in the JSON.

Respond with ONLY the JSON object, no other text.`;

        const userPrompt = `---\n${Object.entries(activeNote?.frontmatter || {}).map(([k, v]) => `${k}: ${v || '""'}`).join('\n')}\n---\n\n${activeNote?.body || ''}`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://performer-obsidian-plugin.dev',
                    'X-Title': 'Performer Obsidian Plugin'
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: 'json_object' }
                })
            });

            if (timerRef.current) clearInterval(timerRef.current);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || `API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response from LLM.');

            const parsed = JSON.parse(content);
            setLlmResults(parsed);

        } catch (err: any) {
            if (timerRef.current) clearInterval(timerRef.current);
            setError(err.message);
        } finally {
            setIsPerforming(false);
        }
    };

    const updateNote = async () => {
        if (!llmResults) return;
        
        setIsPerforming(true); // Show spinner while saving
        try {
            const success = await bridge.saveNote(
                {
                    ...activeNote?.frontmatter,
                    ...llmResults
                },
                llmResults.body || activeNote?.body || ''
            );
            
            if (!success) throw new Error('Failed to save note');
            
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
            syncNote();
        } catch (err: any) {
            setError(`Save failed: ${err.message}`);
        } finally {
            setIsPerforming(false);
        }
    };

    // Settings Helpers
    const updateTemplate = (id: string, updates: Partial<Template>) => {
        setSettings(prev => ({
            ...prev,
            templates: prev.templates.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    };

    const addTemplate = () => {
        if (!newTemplateName.trim()) {
            setIsAddingTemplate(false);
            return;
        }
        const id = newTemplateName.toLowerCase().replace(/\s+/g, '-');
        const newTemplate: Template = {
            id,
            name: newTemplateName,
            noteNamePrompt: 'Extract or categorize this note...',
            fields: [{ name: 'title', prompt: 'Extract or generate a title.' }],
            bodyPrompt: ''
        };
        setSettings(prev => ({ ...prev, templates: [...prev.templates, newTemplate] }));
        setCurrentTemplateId(id);
        setNewTemplateName('');
        setIsAddingTemplate(false);
    };

    const deleteTemplate = (id: string) => {
        if (settings.templates.length <= 1) return;
        setSettings(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) }));
        if (currentTemplateId === id) setCurrentTemplateId(settings.templates[0].id);
    };

    const fetchAvailableModels = async () => {
        setIsFetchingModels(true);
        try {
            const res = await fetch('https://openrouter.ai/api/v1/models');
            const data = await res.json();
            if (data.data) {
                setAvailableModels(data.data);
            }
        } catch (e) {
            console.error('Failed to fetch models:', e);
            setError('Failed to fetch models from OpenRouter.');
        } finally {
            setIsFetchingModels(false);
        }
    };

    return (
        <div className="relative w-full h-screen bg-obsidian-bg text-obsidian-text overflow-hidden font-sans">
            <DataRain />
            {/* LAYER 0: AMBIENT */}
            {settings.glassEffect && (
                <div className="absolute inset-0 layer-0 pointer-events-none overflow-hidden">
                    <div className="absolute inset-0 ambient-grid opacity-20" />
                    <div className="absolute inset-0 ambient-scanlines opacity-5" />
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-obsidian-accent/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-obsidian-tertiary/10 blur-[120px] rounded-full" />
                </div>
            )}

            <div className="relative z-10 w-full h-full flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {view === 'performer' ? (
                        <motion.div 
                            key="performer"
                            initial={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            onPanEnd={(_, info) => {
                                if (info.offset.x > 50) setView('settings');
                            }}
                            className="absolute inset-0 flex flex-col"
                        >
                            {/* Header */}
                            <div className={`sticky top-0 w-full flex items-center justify-between px-arc-5 pt-arc-2 pb-arc-3 ${settings.glassEffect ? 'layer-2 glass-heavy' : 'bg-obsidian-bg/80 backdrop-blur-sm'}`}>
                                <div className="flex items-center gap-arc-3 overflow-hidden">
                                     <h2 className="text-white text-h2 uppercase tracking-wider truncate">Performer</h2>
                                     {bridge.isPlugin && (
                                         <button 
                                            onClick={syncNote}
                                            className="p-1.5 text-obsidian-muted hover:text-obsidian-accent transition-colors"
                                            title="Sync active note"
                                         >
                                             <RefreshCw size={14} className={isPerforming ? 'animate-spin' : ''} />
                                         </button>
                                     )}
                                </div>
                                <button 
                                    onClick={() => setView('settings')} 
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors text-obsidian-muted hover:text-obsidian-accent active:scale-95 ${settings.glassEffect ? 'glass-heavy' : 'hover:bg-shadow-panel'}`}
                                >
                                    <Settings size={20} />
                                </button>
                            </div>
                            
                            {/* Template Dropdown */}
                            <div className={`px-arc-5 pb-arc-3 ${settings.glassEffect ? 'layer-2' : ''}`}>
                                <select 
                                    value={currentTemplateId} 
                                    onChange={(e) => setCurrentTemplateId(e.target.value)} 
                                    className={`w-full border border-obsidian-border rounded-lg px-arc-3 py-arc-2 text-sm text-obsidian-text cursor-pointer custom-select appearance-none outline-none transition-all focus:border-obsidian-accent/50 ${settings.glassEffect ? 'glass-heavy' : 'bg-obsidian-surface'}`}
                                >
                                    {settings.templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Note Name Prompt */}
                            <div className={`px-arc-5 pb-arc-2 ${settings.glassEffect ? 'layer-1' : ''}`}>
                                <div className={`border border-obsidian-border rounded-xl px-arc-4 py-arc-3 shadow-lg ${settings.glassEffect ? 'glass-standard' : 'bg-obsidian-surface'}`}>
                                    <div className="text-obsidian-tertiary text-label mb-arc-1 flex items-center gap-arc-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-obsidian-tertiary shadow-[0_0_8px_rgba(76,114,213,0.8)] peripheral-data" />
                                        Suggested Note Name
                                    </div>
                                    <div className="text-obsidian-accent italic font-medium truncate leading-relaxed text-body-small">
                                        {llmResults?._noteName || currentTemplate.noteNamePrompt || "Extract note name..."}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto custom-scroll px-arc-5 pb-arc-3 text-inter">
                                
                                {/* Frontmatter Section */}
                                <div className={`rounded-2xl p-arc-2 border border-obsidian-border/50 shadow-inner ${settings.glassEffect ? 'glass-standard layer-1' : 'bg-obsidian-surface/40'}`}>
                                    <button 
                                        onClick={() => setFmCollapsed(!fmCollapsed)} 
                                        className="flex items-center gap-arc-2 w-full px-arc-3 py-arc-2 text-obsidian-text hover:text-obsidian-accent transition-colors outline-none text-label"
                                    >
                                        <ChevronDown size={18} className={`transition-transform duration-300 text-obsidian-tertiary ${fmCollapsed ? '-rotate-90' : ''}`} />
                                        <span>Properties</span>
                                        <span className="bg-obsidian-tertiary/20 text-obsidian-tertiary px-arc-2 py-0.5 rounded-lg border border-obsidian-tertiary/30 text-data-label">
                                            {currentTemplate.fields.length}
                                        </span>
                                    </button>
                                    {!fmCollapsed && (
                                        <motion.div 
                                            variants={getStaggerChildren(0.02)}
                                            initial="initial"
                                            animate="animate"
                                            className="space-y-arc-3 pt-arc-2"
                                        >
                                            {currentTemplate.fields.map((field, i) => {
                                                const resultValue = llmResults?.[field.name];
                                                const hasValue = resultValue !== undefined;
                                                return (
                                                    <motion.div 
                                                        key={i} 
                                                        variants={hologramRowsVariants}
                                                        custom={i}
                                                        className={`flex items-stretch rounded-xl border border-obsidian-border/80 bg-obsidian-bg/60 overflow-hidden group hover:border-obsidian-accent/30 transition-all duration-500 ${hasValue ? 'field-highlight ring-1 ring-obsidian-accent/20 layer-2' : ''}`}
                                                    >
                                                        <div className={`${settings.glassEffect ? 'bg-transparent' : 'bg-obsidian-surface'} border-r border-obsidian-border px-arc-3 py-2.5 min-w-[100px] flex items-center`}>
                                                            <span className="text-obsidian-muted group-hover:text-obsidian-tertiary transition-colors text-data-label">{field.name}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            {hasValue ? (
                                                                <input 
                                                                    value={resultValue}
                                                                    onChange={(e) => setLlmResults({ ...llmResults, [field.name]: e.target.value })}
                                                                    className="w-full bg-transparent px-arc-4 py-2.5 text-white outline-none text-data-s layer-2 animate-hologram-jitter"
                                                                />
                                                            ) : (
                                                                <div className="px-arc-4 py-2.5 text-obsidian-muted/40 italic truncate select-none leading-relaxed text-data-s">
                                                                    {"{ " + field.prompt + " }"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </div>
                                
                                {/* Note Body */}
                                <div className={`mt-arc-4 ${settings.glassEffect ? 'layer-1' : ''}`}>
                                    <div className="flex items-center gap-2 py-2">
                                        <FileText size={16} className="text-obsidian-muted" />
                                        <span className="text-obsidian-text text-h4">Note Body</span>
                                        <span className="text-obsidian-muted text-data-label">(read-only)</span>
                                    </div>
                                    <div className={`border border-obsidian-border rounded-lg p-arc-3 text-obsidian-muted leading-relaxed max-h-36 overflow-y-auto custom-scroll whitespace-pre-wrap text-data-micro ${settings.glassEffect ? 'glass-standard' : 'bg-obsidian-surface'}`}>
                                        {llmResults?.body || activeNote?.body || SAMPLE_NOTE.body}
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-arc-3 bg-obsidian-error/10 border border-obsidian-error/30 rounded-lg p-arc-3 text-xs text-obsidian-error flex items-start gap-arc-2 animate-fade-in">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Bottom Bar: Model + Perform */}
                            <div className={`sticky bottom-0 px-arc-5 py-arc-4 border-t border-obsidian-border bg-obsidian-bg/95 backdrop-blur-sm space-y-arc-4 ${settings.glassEffect ? 'layer-2 glass-heavy' : ''}`}>
                                <AnimatePresence>
                                    {isPerforming && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-obsidian-bg/80 backdrop-blur-md"
                                        >
                                            <ArcReactorPulse active={true} />
                                            <motion.p 
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="mt-arc-4 text-obsidian-accent text-label uppercase tracking-widest text-data-micro"
                                            >
                                                Performing Extraction...
                                            </motion.p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="flex items-center gap-arc-3">
                                    <select 
                                        value={selectedModel} 
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className={`flex-1 basis-0 min-w-0 border border-obsidian-border rounded-xl px-arc-4 py-arc-3 text-obsidian-text cursor-pointer custom-select appearance-none outline-none focus:border-obsidian-accent/50 transition-colors text-data-micro ${settings.glassEffect ? 'glass-heavy' : 'bg-obsidian-surface'}`}
                                    >
                                        {settings.models.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={perform} 
                                        className={`flex-1 basis-0 min-w-0 py-arc-3 bg-obsidian-accent hover:bg-obsidian-accent-hover text-obsidian-bg rounded-xl transition-all flex items-center justify-center gap-arc-2 whitespace-nowrap active:scale-95 text-label ${isPerforming ? 'performing-glow' : ''} ${settings.glassEffect ? 'shadow-lg shadow-obsidian-accent/40' : ''}`}
                                    >
                                        <span>{isPerforming ? `${(timer / 1000).toFixed(1)}s` : 'PERFORM'}</span>
                                    </button>
                                </div>

                                <button 
                                    onClick={updateNote} 
                                    className={`w-full py-arc-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-arc-3 overflow-hidden group relative text-label ${llmResults ? 'bg-obsidian-accent text-obsidian-bg shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]' : 'bg-obsidian-surface text-obsidian-muted opacity-30 cursor-not-allowed border border-obsidian-border'}`}
                                    disabled={!llmResults}
                                >
                                    <AnimatePresence mode="wait">
                                        {isSaved ? (
                                            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-arc-2">
                                                <span>Saved!</span>
                                            </motion.div>
                                        ) : (
                                            <motion.div exit={{ y: -20 }} className="flex items-center gap-arc-2">
                                                <span>Update Note</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="settings"
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            onPanEnd={(_, info) => {
                                if (info.offset.x > 50) setView('performer');
                            }}
                            className="absolute inset-0 flex flex-col"
                        >
                            {/* Settings Scrollable */}
                            <div className="flex-1 overflow-y-auto custom-scroll px-arc-5 pb-arc-6 pt-arc-5">
                                                                <section className="mb-arc-6">
                                    <div className={`sticky top-0 w-full flex items-center justify-between mb-arc-4 z-40 py-2 ${settings.glassEffect ? 'layer-2' : ''}`}>
                                        <h3 className="text-white text-h2 uppercase tracking-wider">
                                            Templates
                                        </h3>
                                        <button 
                                            onClick={() => setView('performer')} 
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all text-obsidian-muted hover:text-obsidian-accent active:scale-95 shadow-lg border border-obsidian-border/50 ${settings.glassEffect ? 'glass-heavy layer-2' : 'bg-obsidian-surface hover:bg-obsidian-border'}`}
                                            title="Back to Performer"
                                        >
                                            <ArrowLeft size={22} />
                                        </button>
                                    </div>
                                    
                                    <div className={`border border-obsidian-border rounded-2xl p-arc-5 space-y-arc-5 shadow-xl ${settings.glassEffect ? 'glass-standard layer-1' : 'bg-obsidian-surface/60'}`}>
                                        <div className="flex items-center gap-arc-3">
                                            {isAddingTemplate ? (
                                                <div className="flex-1 flex items-center gap-arc-2">
                                                    <input 
                                                        autoFocus
                                                        placeholder="Name..."
                                                        value={newTemplateName}
                                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && addTemplate()}
                                                        onBlur={() => {
                                                            if (!newTemplateName) setIsAddingTemplate(false);
                                                        }}
                                                        className={`flex-1 border border-obsidian-accent rounded-xl px-arc-3 py-2.5 text-white outline-none text-data-s ${settings.glassEffect ? 'glass-heavy layer-2' : 'bg-obsidian-bg'}`}
                                                    />
                                                    <button 
                                                        onClick={addTemplate}
                                                        className="p-2.5 rounded-xl bg-obsidian-accent text-obsidian-bg hover:bg-obsidian-accent-hover transition-colors layer-2"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <select 
                                                        value={currentTemplateId} 
                                                        onChange={(e) => setCurrentTemplateId(e.target.value)}
                                                        className={`flex-1 border border-obsidian-border rounded-xl px-arc-4 py-arc-3 text-sm text-obsidian-text custom-select outline-none focus:border-obsidian-accent transition-colors ${settings.glassEffect ? 'glass-heavy layer-2' : 'bg-obsidian-bg'}`}
                                                    >
                                                        {settings.templates.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                    <button 
                                                        onClick={() => setIsAddingTemplate(true)} 
                                                        className="w-12 h-12 rounded-xl bg-obsidian-accent/10 border border-obsidian-accent/30 flex items-center justify-center hover:bg-obsidian-accent/20 text-obsidian-accent transition-all active:scale-90 layer-2"
                                                    >
                                                        <Plus size={22} />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                         <div className="flex items-center gap-arc-3">
                                            <button 
                                                onClick={() => deleteTemplate(currentTemplateId)}
                                                className={`flex-1 py-arc-2 text-obsidian-error/70 border border-obsidian-error/20 rounded-xl hover:bg-obsidian-error/10 hover:text-obsidian-error transition-all text-label ${settings.glassEffect ? 'glass-heavy layer-2' : ''}`}
                                            >
                                                Delete
                                            </button>
                                            {isRenamingTemplate === currentTemplateId ? (
                                                <input 
                                                    autoFocus
                                                    value={currentTemplate.name}
                                                    onChange={(e) => updateTemplate(currentTemplateId, { name: e.target.value })}
                                                    onBlur={() => setIsRenamingTemplate(null)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setIsRenamingTemplate(null)}
                                                    className={`flex-1 border border-obsidian-accent rounded-xl px-arc-3 py-arc-2 text-white outline-none text-data-s ${settings.glassEffect ? 'glass-heavy layer-2' : 'bg-obsidian-bg'}`}
                                                />
                                            ) : (
                                                <button 
                                                    onClick={() => setIsRenamingTemplate(currentTemplateId)}
                                                    className={`flex-1 py-arc-2 text-obsidian-muted border border-obsidian-border rounded-xl hover:bg-obsidian-bg hover:text-white transition-all text-label ${settings.glassEffect ? 'glass-heavy layer-2' : ''}`}
                                                >
                                                    Rename
                                                </button>
                                            )}
                                        </div>
                                        
                                         <div>
                                            <label className="text-obsidian-tertiary mb-arc-2 block text-label">Note Name Prompt</label>
                                            <textarea 
                                                value={currentTemplate.noteNamePrompt}
                                                onChange={(e) => updateTemplate(currentTemplateId, { noteNamePrompt: e.target.value })}
                                                rows={2} 
                                                className={`w-full border border-obsidian-border rounded-xl px-arc-4 py-arc-3 text-obsidian-text focus:border-obsidian-accent outline-none resize-none transition-all leading-relaxed text-body-small ${settings.glassEffect ? 'glass-heavy layer-2' : 'bg-obsidian-bg'}`}
                                            />
                                        </div>
                                                                                <div>
                                            <label className="text-obsidian-tertiary mb-arc-2 block text-label">Properties</label>
                                            <div className="space-y-arc-3">
                                                {currentTemplate.fields.map((field, i) => (
                                                    <div key={i} className={`flex items-stretch rounded-xl border border-obsidian-border overflow-hidden group focus-within:border-obsidian-accent/30 transition-all ${settings.glassEffect ? 'glass-heavy' : 'bg-obsidian-bg'}`}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (currentTemplate.fields.length <= 1) return;
                                                                const fields = currentTemplate.fields.filter((_, idx) => idx !== i);
                                                                updateTemplate(currentTemplateId, { fields });
                                                            }}
                                                            className={`w-10 shrink-0 flex items-center justify-center bg-obsidian-error/5 border-r border-obsidian-border transition-all layer-2 ${currentTemplate.fields.length > 1 ? 'hover:bg-obsidian-error group-hover:bg-obsidian-error/20 text-obsidian-error/60 hover:text-white' : 'opacity-20 grayscale'}`}
                                                            disabled={currentTemplate.fields.length <= 1}
                                                            title="Delete field"
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                         <input 
                                                            value={field.name}
                                                            onChange={(e) => {
                                                                const fields = [...currentTemplate.fields];
                                                                fields[i].name = e.target.value;
                                                                updateTemplate(currentTemplateId, { fields });
                                                            }}
                                                            className={`w-24 shrink-0 px-arc-3 py-arc-3 text-obsidian-muted border-r border-obsidian-border outline-none text-data-label layer-2 ${settings.glassEffect ? 'bg-transparent' : 'bg-obsidian-surface/30'}`}
                                                        />
                                                        <textarea 
                                                            value={field.prompt}
                                                            onChange={(e) => {
                                                                const fields = [...currentTemplate.fields];
                                                                fields[i].prompt = e.target.value;
                                                                updateTemplate(currentTemplateId, { fields });
                                                            }}
                                                            rows={1}
                                                            className="flex-1 min-w-0 bg-transparent px-arc-3 py-arc-3 text-xs text-obsidian-text outline-none resize-none transition-all duration-300 focus:min-h-[80px] leading-relaxed custom-scroll layer-2"
                                                            placeholder="Prompt..."
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                             <button 
                                                onClick={() => {
                                                    const fields = [...currentTemplate.fields, { name: 'field', prompt: 'prompt...' }];
                                                    updateTemplate(currentTemplateId, { fields });
                                                }}
                                                className={`mt-arc-3 w-full py-arc-3 text-obsidian-accent border border-dashed border-obsidian-accent/30 rounded-xl hover:bg-obsidian-accent/5 hover:border-obsidian-accent transition-all flex items-center justify-center gap-arc-2 text-label ${settings.glassEffect ? 'glass-heavy layer-2' : ''}`}
                                            >
                                                <Plus size={16} />
                                                Add field
                                            </button>
                                        </div>
                                        
                                         <div>
                                            <label className="text-obsidian-tertiary mb-arc-2 block text-label">Body Prompt (optional)</label>
                                            <textarea 
                                                value={currentTemplate.bodyPrompt}
                                                onChange={(e) => updateTemplate(currentTemplateId, { bodyPrompt: e.target.value })}
                                                rows={3} 
                                                className={`w-full border border-obsidian-border rounded-xl px-arc-4 py-arc-3 text-obsidian-text focus:border-obsidian-accent outline-none resize-none transition-all leading-relaxed text-body-small ${settings.glassEffect ? 'glass-heavy layer-2' : 'bg-obsidian-bg'}`}
                                            />
                                        </div>
                                    </div>
                                </section>

                                 <section className="mb-arc-6">
                                    <h3 className={`text-white mb-arc-4 text-h2 uppercase tracking-wider ${settings.glassEffect ? 'layer-2' : ''}`}>
                                        LLM Engine
                                    </h3>
                                    
                                    <div className={`border border-obsidian-border rounded-2xl p-arc-5 space-y-arc-6 shadow-xl ${settings.glassEffect ? 'glass-standard layer-1' : 'bg-obsidian-surface/60'}`}>
                                        <div>
                                            <div className="flex items-center justify-between mb-arc-2 px-1">
                                                <label className="text-obsidian-tertiary text-label">API Key (OpenRouter)</label>
                                                <button 
                                                    onClick={() => setIsApiKeyEditing(!isApiKeyEditing)}
                                                    className="text-obsidian-accent hover:text-white transition-colors text-label"
                                                >
                                                    {isApiKeyEditing ? 'Done' : 'Edit'}
                                                </button>
                                            </div>
                                            <div className="relative group">
                                                <input 
                                                    type={showKey || isApiKeyEditing ? "text" : "password"}
                                                    value={settings.openRouterApiKey}
                                                    onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                                                    placeholder="sk-or-..." 
                                                    readOnly={!isApiKeyEditing}
                                                    className={`w-full border rounded-xl px-arc-4 py-arc-3 text-xs text-obsidian-text pr-10 outline-none transition-all shadow-inner ${isApiKeyEditing ? 'border-obsidian-accent shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'border-obsidian-border group-hover:border-obsidian-border/80'} ${settings.glassEffect ? 'glass-heavy' : 'bg-obsidian-bg'}`}
                                                />
                                                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-obsidian-muted hover:text-obsidian-accent transition-colors">
                                                    {showKey ? <X size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        
                                         <div>
                                            <label className="text-obsidian-tertiary mb-2.5 block px-1 text-label">Available Models</label>
                                            <div className="space-y-2.5">
                                                {settings.models.map((m, i) => (
                                                    <div key={i} className={`flex items-center gap-0 rounded-xl border border-obsidian-border overflow-hidden group focus-within:border-obsidian-accent/30 transition-all ${settings.glassEffect ? 'glass-heavy' : 'bg-obsidian-bg'}`}>
                                                        <button 
                                                            onClick={() => {
                                                                if (settings.models.length <= 1) return;
                                                                const models = settings.models.filter((_, idx) => idx !== i);
                                                                setSettings({ ...settings, models });
                                                            }}
                                                            className={`w-10 h-10 flex items-center justify-center border-r border-obsidian-border transition-all ${settings.models.length > 1 ? 'bg-obsidian-error/5 text-obsidian-error/60 group-hover:bg-obsidian-error/20 hover:bg-obsidian-error hover:text-white' : 'opacity-20 grayscale'}`}
                                                            disabled={settings.models.length <= 1}
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                        <div className="flex-1 bg-transparent px-arc-4 py-arc-3 text-obsidian-text truncate text-data-micro">
                                                            {m}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {isAddingModel ? (
                                                <div className="mt-arc-4 space-y-arc-3 bg-obsidian-bg/50 p-arc-3 rounded-xl border border-obsidian-border shadow-inner">
                                                    <div className="flex items-center gap-arc-2">
                                                        <input 
                                                            autoFocus
                                                            placeholder="Search models..."
                                                            value={modelSearch}
                                                            onChange={(e) => setModelSearch(e.target.value)}
                                                            className="flex-1 bg-obsidian-bg border border-obsidian-border rounded-lg px-arc-3 py-arc-2 text-xs text-white outline-none focus:border-obsidian-accent"
                                                        />
                                                        <button 
                                                            onClick={() => setIsAddingModel(false)}
                                                            className="text-xs text-obsidian-muted hover:text-white"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                    
                                                    {isFetchingModels ? (
                                                        <div className="py-arc-6 flex flex-col items-center gap-arc-3">
                                                             <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                                                <Sparkles size={20} className="text-obsidian-tertiary" />
                                                            </motion.div>
                                                            <span className="text-obsidian-muted text-label">Loading models...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="max-h-48 overflow-y-auto custom-scroll space-y-1">
                                                            {availableModels
                                                                .filter(m => m.id.toLowerCase().includes(modelSearch.toLowerCase()) || m.name.toLowerCase().includes(modelSearch.toLowerCase()))
                                                                .slice(0, 20)
                                                                .map(m => (
                                                                    <button 
                                                                        key={m.id}
                                                                        onClick={() => {
                                                                            if (!settings.models.includes(m.id)) {
                                                                                setSettings({ ...settings, models: [...settings.models, m.id] });
                                                                            }
                                                                            setIsAddingModel(false);
                                                                            setModelSearch('');
                                                                        }}
                                                                        className="w-full text-left px-arc-3 py-arc-2 text-xs text-obsidian-muted hover:text-white hover:bg-obsidian-accent/10 rounded-lg transition-colors group flex items-center justify-between"
                                                                    >
                                                                        <span className="truncate">{m.id}</span>
                                                                        <Plus size={12} className="opacity-0 group-hover:opacity-100 text-obsidian-accent" />
                                                                    </button>
                                                                ))}
                                                            {availableModels.length > 0 && availableModels.filter(m => m.id.toLowerCase().includes(modelSearch.toLowerCase())).length === 0 && (
                                                                <div className="p-arc-4 text-center text-xs text-obsidian-muted italic">No models found</div>
                                                            )}
                                                            {availableModels.length === 0 && (
                                                                <button 
                                                                    onClick={fetchAvailableModels}
                                                                    className="w-full p-arc-4 text-center text-xs text-obsidian-accent hover:underline"
                                                                >
                                                                    Load model list from OpenRouter
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                 <button 
                                                    onClick={() => {
                                                        setIsAddingModel(true);
                                                        if (availableModels.length === 0) fetchAvailableModels();
                                                    }}
                                                    className={`mt-arc-3 w-full py-arc-3 text-obsidian-accent border border-dashed border-obsidian-accent/30 rounded-xl hover:bg-obsidian-accent/5 hover:border-obsidian-accent transition-all flex items-center justify-center gap-arc-2 text-label ${settings.glassEffect ? 'glass-heavy' : ''}`}
                                                >
                                                    <Plus size={16} />
                                                    Add model
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-arc-6">
                                    <h3 className="text-white mb-arc-4 text-h2 uppercase tracking-wider">
                                        Interface
                                    </h3>
                                    <div className={`border border-obsidian-border rounded-2xl p-arc-5 space-y-arc-6 shadow-xl ${settings.glassEffect ? 'glass-standard layer-1' : 'bg-obsidian-surface/60'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-white text-h4 mb-0.5">Liquid Glass Architecture</div>
                                                <div className="text-obsidian-muted text-data-micro">Enable layered depth and blur effects</div>
                                            </div>
                                            <div 
                                                onClick={() => setSettings({ ...settings, glassEffect: !settings.glassEffect })}
                                                className={`toggle-switch ${settings.glassEffect ? 'active' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
