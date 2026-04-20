import { Plugin, ItemView, WorkspaceLeaf, Notice, PluginSettingTab, Setting, App as ObsidianApp, addIcon } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './src/App';

const VIEW_TYPE_PERFORMER = "performer-view";

const PERFORMER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M 4.5 5.5 L 8.5 5.5 L 8.5 14 M 8.5 5.5 L 14 5.5 C 19.5 5.5, 19.5 13.5, 14 13.5 L 8.5 13.5" />
  <line x1="7.5" y1="17.5" x2="6" y2="21.5" stroke-width="3.5" />
  <path d="M 13.2 7 Q 13.2 9.5 10.7 9.5 Q 13.2 9.5 13.2 12 Q 13.2 9.5 15.7 9.5 Q 13.2 9.5 13.2 7 Z" fill="currentColor" stroke="none" />
</svg>`;

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
    return "performer-logo";
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
    
    // Suggest users to primarily use the plugin UI
    containerEl.createEl('p', { 
        text: 'Note: Full settings management (including model additions, custom prompts, and templates) is available directly inside the Performer plugin interface.',
        cls: 'setting-item-description',
        attr: { style: 'margin-bottom: 20px;' }
    });

    let apiKeyInputEl: HTMLInputElement;

    new Setting(containerEl)
      .setName('OpenRouter API Key')
      .setDesc('Enter your OpenRouter API Key for AI note interpretation.')
      .addText(text => {
        apiKeyInputEl = text.inputEl;
        apiKeyInputEl.type = "password";
        text.setPlaceholder('sk-or-...')
            .setValue(this.plugin.settings.openRouterApiKey)
            .onChange(async (value) => {
              this.plugin.settings.openRouterApiKey = value;
              await this.plugin.saveSettings();
            });
      })
      .addButton(button => button
        .setIcon('eye')
        .setTooltip('Toggle API Key visibility')
        .onClick(() => {
          if (apiKeyInputEl.type === 'password') {
            apiKeyInputEl.type = 'text';
            button.setIcon('eye-off');
          } else {
            apiKeyInputEl.type = 'password';
            button.setIcon('eye');
          }
        }));

    new Setting(containerEl)
      .setName('Primary Model')
      .setDesc('Select the model to set as default. You can add or manage other models directly in the plugin interface.')
      .addDropdown(dropdown => {
        const models = this.plugin.settings.models;
        if (models && models.length > 0) {
          models.forEach(model => {
            dropdown.addOption(model, model.split('/').pop() || model);
          });
          dropdown.setValue(models[0]);
        } else {
          dropdown.addOption('google/gemini-2.0-flash-exp', 'gemini-2.0-flash-exp');
          dropdown.setValue('google/gemini-2.0-flash-exp');
        }

        dropdown.onChange(async (value) => {
          // Move the selected model to the front to make it the default globally
          const filtered = this.plugin.settings.models.filter(m => m !== value);
          this.plugin.settings.models = [value, ...filtered];
          await this.plugin.saveSettings();
        });
      });
  }
}

export default class PerformerPlugin extends Plugin {
  settings: PerformerSettings;

  async onload() {
    await this.loadSettings();

    // Register our custom Performer logo icon early so the OS can paint it
    addIcon("performer-logo", PERFORMER_ICON_SVG);

    this.addSettingTab(new PerformerSettingTab(this.app, this));

    this.registerView(
      VIEW_TYPE_PERFORMER,
      (leaf) => new PerformerView(leaf, this)
    );

    this.addRibbonIcon("performer-logo", "Open Performer", () => {
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
