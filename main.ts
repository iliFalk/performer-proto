import { Plugin, ItemView, WorkspaceLeaf, Notice, PluginSettingTab, Setting, App as ObsidianApp } from 'obsidian';
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

class PerformerSettingTab extends PluginSettingTab {
  plugin: PerformerPlugin;

  constructor(app: ObsidianApp, plugin: PerformerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Performer Settings' });

    new Setting(containerEl)
      .setName('OpenRouter API Key')
      .setDesc('Enter your OpenRouter API Key for AI note interpretation.')
      .addText(text => text
        .setPlaceholder('Enter your API key')
        .setValue(this.plugin.settings.openRouterApiKey)
        .onChange(async (value) => {
          this.plugin.settings.openRouterApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Models')
      .setDesc('Enter comma-separated list of OpenRouter models you want to use.')
      .addTextArea(text => text
        .setPlaceholder('google/gemini-2.0-flash-lite:free, openai/gpt-4o')
        .setValue(this.plugin.settings.models.join(', '))
        .onChange(async (value) => {
          this.plugin.settings.models = value.split(',').map(m => m.trim()).filter(m => m !== '');
          await this.plugin.saveSettings();
        }));
  }
}

export default class PerformerPlugin extends Plugin {
  settings: PerformerSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new PerformerSettingTab(this.app, this));

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
