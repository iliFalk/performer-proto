import { Plugin, ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './src/App';

const VIEW_TYPE_PERFORMER = "performer-view";

class PerformerView extends ItemView {
  root: Root | null = null;
  plugin: PerformerPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: PerformerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_PERFORMER;
  }

  getDisplayText() {
    return "Performer";
  }

  getIcon() {
    return "brain";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    
    // Create a wrapper with fixed height to prevent Obsidian scrolling interference
    const reactRoot = container.createDiv({ cls: 'performer-container' });
    reactRoot.style.height = '100%';
    reactRoot.style.overflow = 'hidden';

    this.root = createRoot(reactRoot);
    this.root.render(
      React.createElement(App, { 
        app: this.app, 
        plugin: this.plugin 
      })
    );
  }

  async onClose() {
    this.root?.unmount();
  }
}

interface PerformerSettings {
  openRouterApiKey: string;
  models: string[];
  templates: any[];
}

const DEFAULT_SETTINGS: PerformerSettings = {
  openRouterApiKey: '',
  models: ['google/gemini-2.0-flash-exp', 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'],
  templates: [] // App code has internal defaults if this is empty
}

export default class PerformerPlugin extends Plugin {
  settings: PerformerSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_PERFORMER,
      (leaf) => new PerformerView(leaf, this)
    );

    this.addRibbonIcon("brain", "Open Performer", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-performer",
      name: "Open Performer panel",
      callback: () => {
        this.activateView();
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_PERFORMER);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_PERFORMER, active: true });
    }

    workspace.revealLeaf(leaf);
  }
}
