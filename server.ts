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
    
    if (!metadata || typeof body !== 'string') {
        return res.status(400).json({ error: 'Invalid payload' });
    }

    try {
      // Ensure notes directory exists
      const notesDir = path.join(process.cwd(), 'notes');
      if (!fs.existsSync(notesDir)) {
        fs.mkdirSync(notesDir);
      }

      // Create a filename from the title securely
      const title = metadata.title || 'Untitled';
      const safeTitle = title
          .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .substring(0, 100) || 'untitled';
      
      const filename = `${safeTitle}-${Date.now()}.md`;
      const filePath = path.resolve(notesDir, filename);

      // Path Traversal guard
      if (!filePath.startsWith(path.resolve(notesDir))) {
          return res.status(400).json({ error: 'Invalid path' });
      }

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
