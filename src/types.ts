export interface TemplateField {
  name: string;
  prompt: string;
}

export interface Template {
  id: string;
  name: string;
  noteNamePrompt: string;
  fields: TemplateField[];
  bodyPrompt?: string;
}

export interface PerformerSettings {
  openRouterApiKey: string;
  models: string[];
  templates: Template[];
}

export interface Note {
  title: string;
  content: string; // Including frontmatter as YAML
}

export interface AppState {
  activeNote: Note | null;
  settings: PerformerSettings;
}
