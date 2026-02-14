import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  plugins: [
    yaml(),
    {
      name: 'yaml-api',
      configureServer(server) {
        // Serve data/ folder at /data/ path
        server.middlewares.use('/data', (req, res, next) => {
          const filePath = path.resolve('data', req.url.replace(/^\//, ''));
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
            fs.createReadStream(filePath).pipe(res);
          } else {
            next();
          }
        });

        // POST /api/save-yaml — write YAML to disk (dev only)
        server.middlewares.use('/api/save-yaml', (req, res, next) => {
          if (req.method !== 'POST') return next();
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { path: yamlPath, content } = JSON.parse(body);
              const fullPath = path.resolve('data', yamlPath);
              // Security: ensure we stay inside data/
              if (!fullPath.startsWith(path.resolve('data'))) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Path outside data/' }));
                return;
              }
              // Ensure directory exists
              fs.mkdirSync(path.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, content, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, path: yamlPath }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });
      }
    }
  ]
});
