import { Template } from '../types';

export interface LLMResponse {
  title?: string;
  fields: Record<string, string>;
  body?: string;
}

export async function performInterpretation(
  apiKey: string,
  model: string,
  template: Template,
  noteContent: string,
  onUpdate?: (msg: string) => void
): Promise<LLMResponse> {
  if (!apiKey) {
    throw new Error('OpenRouter API Key is missing. Please add it in settings.');
  }

  const systemPrompt = `You are "Performer", an AI note interpreter for Obsidian. 
Your task is to analyze the provided note content and fill specific metadata fields and optionally restructure the note body based on the template instructions.

TEMPLATE:
Note Name Prompt: ${template.noteNamePrompt}
Fields:
${template.fields.map(f => `- ${f.name}: ${f.prompt}`).join('\n')}
${template.bodyPrompt ? `Body Restructuring Prompt: ${template.bodyPrompt}` : ''}

Output Format:
You must respond ONLY with a JSON object containing:
1. "title": A string suggested by the Note Name Prompt.
2. "fields": An object where keys are the field names and values are the interpreted strings.
${template.bodyPrompt ? '3. "body": The restructured markdown content for the note.' : ''}

Example Output:
{
  "title": "...",
  "fields": {
    "author": "...",
    "tag": "..."
  }${template.bodyPrompt ? ',\n  "body": "..."' : ''}
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://obsidian-performer.sim',
        'X-Title': 'Obsidian Performer Plugin',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: noteContent }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content) as LLMResponse;
    } catch (e) {
      console.error('Failed to parse LLM response as JSON:', content);
      throw new Error('LLM response was not valid JSON.');
    }
  } catch (error: any) {
    throw new Error(error.message || 'An unexpected error occurred during API call.');
  }
}
