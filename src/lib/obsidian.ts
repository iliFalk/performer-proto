import { App, TFile, Notice } from 'obsidian';
import yaml from 'js-yaml';

export interface ObsidianNote {
  title: string;
  path: string;
  frontmatter: any;
  body: string;
}

export interface ObsidianBridge {
  getActiveNote: () => Promise<ObsidianNote | null>;
  saveNote: (metadata: any, body: string) => Promise<boolean>;
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<void>;
  close: () => void;
  isPlugin: boolean;
}

/**
 * Mock Obsidian Bridge for Browser Environment
 */
const createMockBridge = (): ObsidianBridge => {
  const SAMPLE_NOTE = {
    // ... lines 24-33 ...
    title: 'Productivity Tips for Remote Workers',
    path: 'productivity-tips.md',
    frontmatter: {
      title: '',
      author: '',
      type: '',
      tags: ''
    },
    body: `# Productivity Tips for Remote Workers\n\nWorking from home has become the new normal for many of us...\n\n## Morning Routine\nStart your day with a consistent routine.`
  };

  return {
    getActiveNote: async () => SAMPLE_NOTE,
    saveNote: async (metadata, body) => {
      // ...
      console.log('MOCK SAVE:', { metadata, body });
      try {
        const response = await fetch('/api/save-note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata, body })
        });
        return response.ok;
      } catch (e) {
        return false;
      }
    },
    getSettings: async () => {
      const saved = localStorage.getItem('performer_settings');
      return saved ? JSON.parse(saved) : null;
    },
    saveSettings: async (settings) => {
      localStorage.setItem('performer_settings', JSON.stringify(settings));
    },
    close: () => {
      window.location.reload(); // Simple mock refresh
    },
    isPlugin: false
  };
};

/**
 * Real Obsidian Bridge
 */
const createRealBridge = (app: App, plugin: any): ObsidianBridge => {
  return {
    getActiveNote: async () => {
      // ...
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) return null;

      const content = await app.vault.read(activeFile);
      const cache = app.metadataCache.getFileCache(activeFile);
      
      let body = content;
      let frontmatter = {};

      if (cache?.frontmatter) {
        frontmatter = { ...cache.frontmatter };
        // Approximate body by removing frontmatter block
        const match = content.match(/^---[\s\S]*?---\n?([\s\S]*)$/);
        if (match) body = match[1];
      }

      return {
        title: activeFile.basename,
        path: activeFile.path,
        frontmatter,
        body: body.trim()
      };
    },
    saveNote: async (metadata, body) => {
      // ...
      const activeFile = app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice('No active file to save to.');
        return false;
      }

      try {
        await app.vault.process(activeFile, (content) => {
          // Construct new content
          const cleanMetadata = { ...metadata };
          // Remove internal keys starting with _
          Object.keys(cleanMetadata).forEach(key => {
            if (key.startsWith('_')) delete cleanMetadata[key];
          });

          const yamlStr = yaml.dump(cleanMetadata);
          return `---\n${yamlStr}---\n\n${body}`;
        });
        
        new Notice('Note updated successfully!');
        return true;
      } catch (error) {
        console.error('Save failed:', error);
        new Notice('Failed to update note.');
        return false;
      }
    },
    getSettings: async () => plugin.settings,
    saveSettings: async (settings) => {
      plugin.settings = settings;
      await plugin.saveSettings();
    },
    close: () => {
      // In Obsidian, we find the leaf containing this view and detach it.
      // This is the robust way to close the sidebar.
      app.workspace.getLeavesOfType('performer-view').forEach(leaf => leaf.detach());
    },
    isPlugin: true
  };
};

let bridge: ObsidianBridge | null = null;

export const getObsidianBridge = (app?: App, plugin?: any): ObsidianBridge => {
  if (bridge) return bridge;
  
  if (app && plugin) {
    bridge = createRealBridge(app, plugin);
  } else {
    bridge = createMockBridge();
  }
  
  return bridge;
};
