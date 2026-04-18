import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/save-note', (req, res) => {
    const { metadata, body } = req.body;
    
    try {
      // Ensure notes directory exists
      const notesDir = path.join(process.cwd(), 'notes');
      if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir);
      }

      // Create a filename from the title or timestamp
      const title = metadata.title || 'Untitled';
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${safeTitle}-${Date.now()}.md`;
      const filePath = path.join(notesDir, filename);

      // Construct content with YAML frontmatter
      const fileContent = `---\n${yaml.dump(metadata)}---\n\n${body}`;

      fs.writeFileSync(filePath, fileContent);
      
      console.log(`Saved note to ${filePath}`);
      res.json({ success: true, path: filePath });
    } catch (error) {
      console.error('Save failed:', error);
      res.status(500).json({ error: 'Failed to save note' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
