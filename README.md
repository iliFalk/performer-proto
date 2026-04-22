## 📸 Preview

<div align="center">

<img src=".assets/image (1).png" width="1200" height="475" alt="Plugin Workflow" />

</div>

---

# 🔍 Performer

**The magnifier for your thoughts.**

Performer is a digital "loupe" for Obsidian that clarifies, structures, and enriches your notes for a better Personal Knowledge Base. It doesn't just change your notes; it helps you see the structure that was already there, but hidden.

---

## ✨ The Idea

Transform chaotic drafts into structured knowledge in seconds.

### Before
```markdown
meeting with Sarah today about the solar project.
we talked about the panels and the deadline is next friday.
sarah says we need more cables.
```

### After
```markdown
---
title: Solar Project - Panel Logistics & Deadlines
date: 2025-05-23
participants: Sarah
type: meeting
tags: project
---

## Discussion
- Review of current panel status.
- Deadline confirmed for next Friday.

## Action Items
- [ ] Order additional cables (Requested by Sarah).
```

---

## 🛠️ How it Works

Performer is designed to be a fluid, high-performance overlay that stays out of your way until you need it.

1.  **Trigger the Loupe:** While in any note, tap the **"Open Performer"/Ribbon icon** (or use the command palette). The Performer overlay slides in naturally.
2.  **Choose Your Performance:** Select a pre-built template (like "Meeting" or "Book") from the main menu and hit **PERFORM**.
3.  **Refine & Save:** Watch as the AI populates properties and suggests a restructured body. Tweak any field manually if needed, then hit **Update Note**.

### 🪄 One-Tap Magic
Once your templates are set, the friction disappears. Open a note, select your template, and click one button to transform your messy thoughts into a perfectly structured record for your PKB.

---

## 🎭 Custom Performances (Examples)

You have full control over the "script" the AI follows. In the **Settings**, you can build custom templates by defining specific prompts:

### Example 1: The "Project Brief" (Work)
*   **Note Name Prompt:** "Create a formal project ID: [PROJECT-CODE] [Subject]"
*   **Frontmatter Prompts:**
    *   `priority`: "High, Medium, or Low based on urgency."
    *   `stakeholders`: "List all departments involved."
    *   `deadline`: "Extract the final delivery date."
*   **Body Prompt:** "Summarize into Objectives, Risks, and Next Steps."

### Example 2: The "Trip Planner" (Personal)
*   **Note Name Prompt:** "Suggest a title like '2025 - [City] Trip Planning'"
*   **Frontmatter Prompts:**
    *   `destination`: "Extract the city and country."
    *   `budget`: "Estimate the total cost mentioned."
    *   `days`: "Count how many days the trip lasts."
*   **Body Prompt:** "Format as a bulleted itinerary with sections for 'Must-See' and 'Food'."

---

## 🛠️ Core Capabilities

### 🔍 The Loupe (Natural Overlay)
Performer acts as a lens you slide over your note. It's a fluid overlay that feels like a natural extension of your writing process, not a separate utility.

### 🧬 Metadata Synthesis
Automatically extracts and generates Frontmatter. It identifies titles, authors, dates, and types, turning raw text into a queryable database.

### 🏛️ Deep Restructuring
Polishes note bodies into consistent, clean structures optimized for long-term storage and future retrieval.

---

## 🚀 Getting Started

### 1. Installation (via BRAT)
As a prototype, Performer is best installed via the [Obsidian BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin:
1. Install **BRAT** from the Community Plugins.
2. Open BRAT settings and click **"Add Beta plugin"**.
3. Paste the URL of this repository.
4. Enable **Performer** in your Community Plugins list.

### 2. The Engine (OpenRouter)
Performer is powered by OpenRouter, giving you the freedom to choose your preferred "performance" model:
1. Get an API key from [openrouter.ai](https://openrouter.ai/).
2. Open Performer Settings in Obsidian.
3. Paste your key and select your model (e.g., Gemini 2.0, GPT-4o, or Claude 3.5).

---

## 🏗️ The Blueprint
Built with modern web technologies for a fluid experience:
- **React 19** & **Vite** for high performance.
- **Motion (framer-motion)** for natural, organic interactions.
- **OpenRouter API** for flexible AI intelligence.
