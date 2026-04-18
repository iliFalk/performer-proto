import { Template, PerformerSettings } from './types';

export const DEFAULT_MODELS = [
  "google/gemini-2.0-flash-001",
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-haiku",
];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'raw',
    name: 'raw',
    noteNamePrompt: 'Create a concise title for this note.',
    fields: [
      { name: 'author', prompt: 'Identify the author if mentioned, otherwise "unknown".' },
      { name: 'type', prompt: 'Categorize this note (e.g., article, thought, meeting, task).' },
      { name: 'tags', prompt: 'Generate 3-5 relevant tags as a comma-separated list.' },
    ],
    bodyPrompt: 'Clean up the text, fix typos, and structure it into clear sections with headers if applicable. Keep the original meaning intact.'
  },
  {
    id: 'meeting',
    name: 'meeting',
    noteNamePrompt: 'Meeting: [Project Name] - [Date]',
    fields: [
      { name: 'attendees', prompt: 'List all people mentioned as participants.' },
      { name: 'project', prompt: 'Identify the main project discussed.' },
      { name: 'action_items', prompt: 'Summarize key action items discovered.' },
    ],
    bodyPrompt: 'Format these meeting notes into: Context, Key Discussions, Decisions, and Action Items.'
  }
];

export const INITIAL_SETTINGS: PerformerSettings = {
  openRouterApiKey: '',
  models: DEFAULT_MODELS,
  templates: DEFAULT_TEMPLATES,
};

export const SAMPLE_NOTE = `---
title: Initial Thoughts
date: 2024-04-16
---

Today I had an amazing idea for a new obsidian plugin. It should be called performer. 
i want it to use openrouter to help me enrich my notes on ios. 
the main thing is that it should be able to fill frontmatter fields based on what i wrote in the note.
also restructuring the body would be cool.
ilja mentioned that mobility is key here.`;
