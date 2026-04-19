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
  RefreshCw,
  Zap
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
    theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: SettingsState = {
    openRouterApiKey: '',
    models: ['google/gemini-2.0-flash-exp', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
    theme: 'system',
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

    // Theme Management
    useEffect(() => {
        const root = document.documentElement;
        if (settings.theme === 'system') {
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
            
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                if (settings.theme === 'system') {
                    root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
                }
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            root.setAttribute('data-theme', settings.theme);
        }
    }, [settings.theme]);

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
        <div id="arc-reactor-plugin" className="fixed inset-0 w-full h-screen bg-black/60 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-obsidian-text overflow-hidden font-sans pointer-events-auto p-4">
            <div className="w-full h-[80vh] sm:w-[400px] sm:max-w-md bg-obsidian-bg rounded-[2rem] shadow-[0_24px_64px_rgba(0,0,0,0.6)] ring-1 ring-obsidian-border/50 ring-inset relative flex flex-col overflow-hidden isolate">
                <AnimatePresence mode="wait">
                    {view === 'performer' ? (
                        <motion.div 
                            key="performer"
                            initial={{ x: 0, opacity: 1 }}
                            exit={{ x: -100, opacity: 0 }}
                            className="w-full h-full flex flex-col"
                        >
                            {/* Header */}
                            <div className="sticky top-0 w-full flex items-center justify-between px-arc-4 pt-arc-4 pb-arc-3 layer-2 glass-heavy border-b border-arc-primary/20 z-50">
                                <div className="flex items-center gap-arc-3 overflow-hidden">
                                     <h2 className="text-white text-[16px] uppercase tracking-[0.12em] font-display font-black truncate">Performer</h2>
                                     {bridge.isPlugin && (
                                         <button 
                                            onClick={syncNote}
                                            className="p-1.5 text-obsidian-muted hover:text-obsidian-accent transition-colors bg-obsidian-border/30 rounded-lg"
                                            title="Sync active note"
                                         >
                                             <RefreshCw size={12} className={isPerforming ? 'animate-spin' : ''} />
                                         </button>
                                     )}
                                </div>
                                <button 
                                    onClick={() => setView('settings')} 
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all text-obsidian-muted hover:text-obsidian-accent hover:shadow-arc-glow-subtle active:scale-95 glass-heavy border border-arc-primary/30"
                                >
                                    <Settings size={18} />
                                </button>
                            </div>
                            
                            {/* Scrollable Content wrapper */}
                            <div className="flex-1 flex flex-col min-h-0 px-arc-4 pb-arc-4 pt-arc-3 space-y-arc-3 overflow-y-auto custom-scroll">
                                {/* Template Dropdown */}
                                <div className="layer-2 shrink-0">
                                    <select 
                                        value={currentTemplateId} 
                                        onChange={(e) => setCurrentTemplateId(e.target.value)} 
                                        className="w-full border border-obsidian-border rounded-lg px-arc-3 py-arc-2 text-sm text-obsidian-text cursor-pointer custom-select appearance-none outline-none transition-all focus:border-obsidian-accent/50 glass-heavy"
                                    >
                                        {settings.templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Note Name Prompt */}
                                <div className="layer-1 shrink-0">
                                    <div className="border border-arc-primary/20 rounded-lg px-2.5 py-1.5 shadow-arc-card glass-standard">
                                        <div className="text-obsidian-tertiary text-[9px] uppercase font-bold tracking-[0.1em] flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-obsidian-tertiary shadow-arc-glow-subtle peripheral-data" />
                                            Note name
                                        </div>
                                        <div className="text-obsidian-accent italic font-medium truncate leading-tight text-[11px] tracking-wide opacity-80 pl-2.5 mt-0.5">
                                            {llmResults?._noteName || "Suggest a concise, descriptive..."}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Frontmatter Section */}
                                <div className="shrink-0 rounded-2xl border border-obsidian-border/30 overflow-hidden glass-standard layer-1">
                                    <button 
                                        onClick={() => setFmCollapsed(!fmCollapsed)} 
                                        className="flex items-center gap-arc-3 w-full px-arc-4 py-arc-4 text-obsidian-text hover:text-obsidian-accent hover:bg-white/5 transition-all outline-none bg-transparent! border-none!"
                                    >
                                        <ChevronDown size={18} className={`transition-transform duration-500 text-obsidian-tertiary ${fmCollapsed ? '-rotate-90' : ''}`} />
                                        <span className="text-label tracking-[0.2em] font-black uppercase text-obsidian-text">Properties</span>
                                        <div className="ml-auto bg-obsidian-tertiary/20 text-obsidian-tertiary px-2 py-0.5 rounded-lg border border-obsidian-tertiary/30 text-data-label font-bold">
                                            {currentTemplate.fields.length}
                                        </div>
                                    </button>
                                    {!fmCollapsed && (
                                        <motion.div 
                                            variants={getStaggerChildren(0.02)}
                                            initial="initial"
                                            animate="animate"
                                            className="px-arc-4 pb-arc-4 space-y-1.5"
                                        >
                                            {currentTemplate.fields.map((field, i) => {
                                                const resultValue = llmResults?.[field.name];
                                                const hasValue = resultValue !== undefined;
                                                return (
                                                    <motion.div 
                                                        key={i} 
                                                        variants={hologramRowsVariants}
                                                        custom={i}
                                                        className={`flex items-stretch rounded-lg border border-obsidian-border/50 bg-obsidian-bg/30 overflow-hidden group hover:border-obsidian-accent/30 transition-all duration-300 ${hasValue ? 'field-highlight border-arc-primary/50 layer-2' : ''}`}
                                                    >
                                                        <div className="bg-obsidian-surface/50 border-r border-obsidian-border/50 px-2 py-1.5 min-w-[76px] flex items-center justify-center">
                                                            <span className="text-obsidian-muted group-hover:text-obsidian-tertiary transition-colors text-[9px] font-mono tracking-[0.15em] uppercase opacity-80 text-center">{field.name}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex items-center">
                                                            {hasValue ? (
                                                                    <input 
                                                                    value={resultValue}
                                                                    onChange={(e) => setLlmResults({ ...llmResults, [field.name]: e.target.value })}
                                                                    className="w-full bg-transparent px-3 py-1.5 text-obsidian-text outline-none text-[12px] font-mono layer-2 hover:bg-black/5 transition-colors"
                                                                />
                                                            ) : (
                                                                <div className="px-3 py-1.5 text-obsidian-muted/70 italic truncate select-none text-[12px] font-mono leading-tight">
                                                                    {field.prompt}
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
                                <div className="flex-1 flex flex-col min-h-0 layer-1">
                                    <div className="shrink-0 flex items-center gap-2 mb-arc-3">
                                        <FileText size={14} className="text-obsidian-tertiary opacity-70" />
                                        <span className="text-label">Note Body</span>
                                        <span className="text-obsidian-muted text-[10px] tracking-wider opacity-60 uppercase">(Preview Only)</span>
                                    </div>
                                    <div className="flex-1 border border-obsidian-border/40 rounded-xl p-arc-4 text-obsidian-text/80 leading-relaxed overflow-y-auto custom-scroll whitespace-pre-wrap text-data-micro glass-standard">
                                        {llmResults?.body || activeNote?.body || SAMPLE_NOTE.body}
                                    </div>
                                </div>

                                {error && (
                                    <div className="shrink-0 mb-arc-3 bg-obsidian-error/10 border border-obsidian-error/30 rounded-lg p-arc-3 text-xs text-obsidian-error flex items-start gap-arc-2 animate-fade-in">
                                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Bottom Bar: Model + Perform */}
                            <div className="sticky bottom-0 px-arc-4 pt-arc-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-arc-primary/20 bg-obsidian-bg/95 backdrop-blur-md space-y-arc-3 layer-2 glass-heavy z-50">
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
                                                className="mt-arc-3 text-obsidian-accent text-label uppercase tracking-widest text-data-micro"
                                            >
                                                Performing Extraction...
                                            </motion.p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="flex gap-arc-3">
                                    <div className="flex-1 relative min-w-0">
                                        <select 
                                            value={selectedModel} 
                                            onChange={(e) => setSelectedModel(e.target.value)}
                                            className="w-full h-8 sm:h-10 border border-arc-primary/30 rounded-xl px-arc-3 text-obsidian-text cursor-pointer custom-select appearance-none outline-none focus:border-obsidian-accent transition-all text-data-micro glass-ghost"
                                        >
                                            {settings.models.map(m => (
                                                <option key={m} value={m}>{m.split('/').pop()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={perform} 
                                        className={`flex-1 btn-arc group h-8 sm:h-10 whitespace-nowrap flex items-center justify-center gap-2 ${isPerforming ? 'performing-glow' : ''}`}
                                    >
                                        <Zap size={12} className={isPerforming ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                                        <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.1em]">{isPerforming ? `${(timer / 1000).toFixed(1)}s` : 'PERFORM'}</span>
                                    </button>
                                </div>

                                <button 
                                    onClick={updateNote} 
                                    className={llmResults ? 'btn-arc-primary w-full h-8 sm:h-10' : 'btn-arc w-full h-8 sm:h-10 opacity-30 cursor-not-allowed border-obsidian-border'}
                                    disabled={!llmResults}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Save size={14} />
                                        <AnimatePresence mode="wait">
                                            {isSaved ? (
                                                <motion.span className="text-[10px] sm:text-[11px] font-bold tracking-[0.1em]" key="saved" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>Saved!</motion.span>
                                            ) : (
                                                <motion.span className="text-[10px] sm:text-[11px] font-bold tracking-[0.1em]" key="update" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>Update Note</motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="settings"
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-full h-full flex flex-col"
                        >
                            {/* Settings Scrollable */}
                            <div className="flex-1 overflow-y-auto custom-scroll px-arc-5 pb-arc-6 pt-arc-5">
                                                                <section className="mb-arc-6">
                                    <div className="sticky top-0 w-full flex items-center justify-between mb-arc-4 z-40 py-1 layer-2">
                                        <h3 className="text-white text-h2 uppercase tracking-wider">
                                            Templates
                                        </h3>
                                        <button 
                                            onClick={() => setView('performer')} 
                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all text-obsidian-muted hover:text-obsidian-accent active:scale-95 shadow-lg border border-obsidian-border/50 glass-heavy layer-2"
                                            title="Back to Performer"
                                        >
                                            <ArrowLeft size={18} />
                                        </button>
                                    </div>
                                    
                                    <div className="border border-obsidian-border rounded-2xl p-arc-5 space-y-arc-5 shadow-xl glass-standard layer-1">
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
                                                        className="flex-1 border border-obsidian-accent rounded-xl px-arc-3 py-2.5 text-white outline-none text-data-s glass-heavy layer-2"
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
                                                        className="flex-1 arc-base-select px-arc-4 py-arc-3 text-sm outline-none! focus:border-arc-primary! transition-all"
                                                    >
                                                        {settings.templates.map(t => (
                                                            <option key={t.id} value={t.id} className="bg-[#0a0e17] text-white">{t.name}</option>
                                                        ))}
                                                    </select>
                                                    <div 
                                                        role="button"
                                                        onClick={() => setIsAddingTemplate(true)} 
                                                        className="w-12 h-12 btn-arc flex items-center justify-center p-0! cursor-pointer"
                                                    >
                                                        <Plus size={22} />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                         <div className="flex items-center gap-arc-3">
                                            <div 
                                                role="button"
                                                onClick={() => deleteTemplate(currentTemplateId)}
                                                className="flex-1 flex justify-center items-center py-arc-2 text-obsidian-error/70 border border-obsidian-error/20 rounded-xl hover:bg-[#8e1c1c]/30! hover:text-obsidian-error transition-all text-label cursor-pointer pointer-events-auto glass-heavy layer-2"
                                            >
                                                Delete
                                            </div>
                                            {isRenamingTemplate === currentTemplateId ? (
                                                <input 
                                                    autoFocus
                                                    value={currentTemplate.name}
                                                    onChange={(e) => updateTemplate(currentTemplateId, { name: e.target.value })}
                                                    onBlur={() => setIsRenamingTemplate(null)}
                                                    onKeyDown={(e) => e.key === 'Enter' && setIsRenamingTemplate(null)}
                                                    className="flex-1 border border-obsidian-accent rounded-xl px-arc-3 py-arc-2 text-white outline-none text-data-s glass-heavy layer-2"
                                                />
                                            ) : (
                                                <div 
                                                    role="button"
                                                    onClick={() => setIsRenamingTemplate(currentTemplateId)}
                                                    className="flex-1 flex justify-center items-center py-arc-2 text-obsidian-muted border border-obsidian-border rounded-xl hover:bg-[#1a202c]! hover:text-white transition-all text-label cursor-pointer pointer-events-auto glass-heavy layer-2"
                                                >
                                                    Rename
                                                </div>
                                            )}
                                        </div>
                                        
                                         <div>
                                             <label className="text-obsidian-tertiary mb-arc-2 block text-label tracking-[0.1em] uppercase">Note Name Prompt</label>
                                             <textarea 
                                                 value={currentTemplate.noteNamePrompt}
                                                 onChange={(e) => updateTemplate(currentTemplateId, { noteNamePrompt: e.target.value })}
                                                 rows={2} 
                                                 className="w-full arc-base-input px-arc-4 py-arc-3 outline-none resize-none transition-all leading-relaxed text-body-small focus:border-arc-primary! rounded-xl"
                                             />
                                        </div>
                                                                                <div>
                                            <label className="text-obsidian-tertiary mb-arc-2 block text-label tracking-[0.1em] uppercase">Properties</label>
                                            <div className="space-y-arc-3">
                                                {currentTemplate.fields.map((field, i) => (
                                                    <div key={i} className="flex items-stretch rounded-xl border border-obsidian-border/30 glass-heavy overflow-hidden group focus-within:border-arc-primary/50 transition-all mb-arc-3">
                                                        <div 
                                                            role="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (currentTemplate.fields.length <= 1) return;
                                                                const fields = currentTemplate.fields.filter((_, idx) => idx !== i);
                                                                updateTemplate(currentTemplateId, { fields });
                                                            }}
                                                            className={`w-10 shrink-0 flex items-center justify-center border-r border-obsidian-border/30 transition-all pointer-events-auto cursor-pointer self-stretch ${currentTemplate.fields.length > 1 ? 'hover:bg-[#8e1c1c]! text-obsidian-error/60 hover:text-white' : 'opacity-20 grayscale pointer-events-none'}`}
                                                            title="Delete field"
                                                        >
                                                            <X size={16} strokeWidth={3} />
                                                        </div>
                                                        <input 
                                                            value={field.name}
                                                            onChange={(e) => {
                                                                const fields = [...currentTemplate.fields];
                                                                fields[i].name = e.target.value;
                                                                updateTemplate(currentTemplateId, { fields });
                                                            }}
                                                            className="arc-base-input w-24 shrink-0 px-arc-3 py-arc-3 text-obsidian-muted border-r border-obsidian-border/30 outline-none text-data-label font-bold uppercase tracking-wider"
                                                        />
                                                        <textarea 
                                                            value={field.prompt}
                                                            onChange={(e) => {
                                                                const fields = [...currentTemplate.fields];
                                                                fields[i].prompt = e.target.value;
                                                                updateTemplate(currentTemplateId, { fields });
                                                            }}
                                                            rows={1}
                                                            className="arc-base-input flex-1 min-w-0 px-arc-3 py-arc-3 text-xs text-obsidian-text outline-none resize-none transition-all duration-300 focus:min-h-[80px] leading-relaxed custom-scroll"
                                                            placeholder="Prompt..."
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div 
                                                role="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const fields = [...currentTemplate.fields, { name: 'field', prompt: 'prompt...' }];
                                                    updateTemplate(currentTemplateId, { fields });
                                                }}
                                                className="mt-arc-3 w-full btn-arc flex items-center justify-center gap-arc-2 py-4! text-base! font-bold layer-3 pointer-events-auto cursor-pointer"
                                            >
                                                <Plus size={20} />
                                                Add field
                                            </div>
                                        </div>
                                        
                                         <div>
                                            <label className="text-obsidian-tertiary mb-arc-2 block text-label tracking-[0.1em] uppercase">Body Prompt (optional)</label>
                                            <textarea 
                                                value={currentTemplate.bodyPrompt}
                                                onChange={(e) => updateTemplate(currentTemplateId, { bodyPrompt: e.target.value })}
                                                rows={3} 
                                                className="w-full arc-base-input px-arc-4 py-arc-3 outline-none resize-none transition-all leading-relaxed text-body-small focus:border-arc-primary! rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-arc-6">
                                    <h3 className="text-white mb-arc-4 text-h2 uppercase tracking-wider layer-2">
                                        Interface
                                    </h3>
                                    
                                    <div className="border border-obsidian-border rounded-2xl p-arc-5 space-y-arc-6 shadow-xl glass-standard layer-1">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-obsidian-text mb-1 block text-sm font-medium tracking-[0.1em] uppercase">Theme</label>
                                                <div className="text-xs text-obsidian-muted">Set the system dark/light mode preference</div>
                                            </div>
                                            <select 
                                                value={settings.theme} 
                                                onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                                                className="arc-base-select rounded-lg px-arc-3 py-arc-2 text-sm text-obsidian-text cursor-pointer custom-select appearance-none outline-none transition-all focus:border-obsidian-accent/50 glass-heavy"
                                            >
                                                <option value="system">System</option>
                                                <option value="dark">Dark</option>
                                                <option value="light">Light</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                 <section className="mb-arc-6">
                                    <h3 className="text-white mb-arc-4 text-h2 uppercase tracking-wider layer-2">
                                        LLM Engine
                                    </h3>
                                    
                                    <div className="border border-obsidian-border rounded-2xl p-arc-5 space-y-arc-6 shadow-xl glass-standard layer-1">
                                        <div>
                                            <div className="flex items-center justify-between mb-arc-2 px-1">
                                                <label className="text-obsidian-tertiary text-label tracking-[0.1em] uppercase">API Key (OpenRouter)</label>
                                                <div 
                                                    role="button"
                                                    onClick={() => setIsApiKeyEditing(!isApiKeyEditing)}
                                                    className="btn-arc flex items-center justify-center py-1 px-4 text-xs cursor-pointer"
                                                >
                                                    {isApiKeyEditing ? 'Done' : 'Edit'}
                                                </div>
                                            </div>
                                            <div className={`flex items-center w-full arc-base-input rounded-xl px-arc-4 transition-all border ${isApiKeyEditing ? 'border-arc-primary shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'border-obsidian-border/50'}`}>
                                                <input 
                                                    type={showKey || isApiKeyEditing ? "text" : "password"}
                                                    value={settings.openRouterApiKey}
                                                    onChange={(e) => setSettings({ ...settings, openRouterApiKey: e.target.value })}
                                                    placeholder="sk-or-..." 
                                                    readOnly={!isApiKeyEditing}
                                                    className="flex-1 arc-base-transparent outline-none! border-none! shadow-none! py-arc-3 text-xs m-0! min-w-0"
                                                />
                                                <div 
                                                    role="button"
                                                    onClick={() => setShowKey(!showKey)} 
                                                    className="flex-shrink-0 ml-2 flex items-center justify-center text-obsidian-muted hover:text-arc-primary transition-colors cursor-pointer w-6 h-6"
                                                >
                                                    {showKey ? <X size={16} /> : <Eye size={16} />}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-obsidian-tertiary mb-2.5 block px-1 text-label tracking-[0.1em] uppercase">Available Models</label>
                                            <div className="space-y-2.5">
                                                {settings.models.map((m, i) => (
                                                    <div key={i} className="flex items-stretch gap-0 rounded-xl border border-obsidian-border/30 glass-heavy overflow-hidden group focus-within:border-arc-primary/30 transition-all">
                                                        <div 
                                                            role="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (settings.models.length <= 1) return;
                                                                const models = settings.models.filter((_, idx) => idx !== i);
                                                                setSettings({ ...settings, models });
                                                            }}
                                                            className={`w-10 self-stretch flex items-center justify-center border-r border-obsidian-border/30 transition-all cursor-pointer pointer-events-auto ${settings.models.length > 1 ? 'hover:bg-[#8e1c1c]! text-obsidian-error/80 hover:text-white' : 'opacity-20 grayscale pointer-events-none'}`}
                                                        >
                                                            <X size={16} strokeWidth={3} />
                                                        </div>
                                                        <div className="flex-1 bg-transparent px-arc-4 py-arc-3 text-obsidian-text truncate text-data-micro font-mono">
                                                            {m}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {isAddingModel ? (
                                                <div className="mt-arc-4 space-y-arc-3 glass-heavy p-arc-3 rounded-xl border border-obsidian-border/30 bg-[#0a0e17]! layer-3">
                                                    <div className="flex items-center gap-arc-2">
                                                        <input 
                                                            autoFocus
                                                            placeholder="Search models..."
                                                            value={modelSearch}
                                                            onChange={(e) => setModelSearch(e.target.value)}
                                                            className="flex-1 arc-base-input rounded-xl px-arc-3 py-arc-2 text-xs outline-none focus:border-arc-primary!"
                                                        />
                                                        <div 
                                                            role="button"
                                                            onClick={() => setIsAddingModel(false)}
                                                            className="text-xs text-obsidian-muted hover:text-white uppercase tracking-wider py-1 px-2 hover:bg-white/5 rounded transition-all cursor-pointer"
                                                        >
                                                            Close
                                                        </div>
                                                    </div>
                                                    
                                                    {isFetchingModels ? (
                                                        <div className="py-arc-6 flex flex-col items-center gap-arc-3">
                                                             <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                                                <Zap size={20} className="text-arc-primary" />
                                                            </motion.div>
                                                            <span className="text-obsidian-muted text-label uppercase tracking-widest">Synchronizing...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="max-h-48 overflow-y-auto custom-scroll space-y-1">
                                                            {availableModels
                                                                .filter(m => m.id.toLowerCase().includes(modelSearch.toLowerCase()) || m.name.toLowerCase().includes(modelSearch.toLowerCase()))
                                                                .slice(0, 20)
                                                                .map(m => (
                                                                    <button 
                                                                        key={m.id}
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            if (!settings.models.includes(m.id)) {
                                                                                setSettings({ ...settings, models: [...settings.models, m.id] });
                                                                            }
                                                                            setIsAddingModel(false);
                                                                            setModelSearch('');
                                                                        }}
                                                                        className="w-full text-left px-arc-3 py-arc-2 text-xs text-obsidian-muted hover:text-arc-primary hover:bg-arc-primary/10 rounded-lg transition-colors group flex items-center justify-between bg-transparent!"
                                                                    >
                                                                        <span className="truncate font-mono">{m.id}</span>
                                                                        <Plus size={12} className="opacity-0 group-hover:opacity-100 text-arc-primary" />
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                 <button 
                                                    onClick={() => {
                                                        setIsAddingModel(true);
                                                        if (availableModels.length === 0) fetchAvailableModels();
                                                    }}
                                                    className="mt-arc-3 w-full btn-arc flex items-center justify-center gap-arc-2"
                                                >
                                                    <Plus size={16} />
                                                    Add model
                                                </button>
                                            )}
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
