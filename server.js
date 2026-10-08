const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8' };
const publicFiles = new Set(['index.html','styles.css','script.js','house-tour.css','house-tour.mjs','assets/house-reference.png','vendor/three.module.js','vendor/three.core.js','vendor/OrbitControls.js','vendor/THREE-LICENSE.txt']);
http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  const file = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!publicFiles.has(file)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(root,file),(err,data) => { if(err) { res.writeHead(500); return res.end('Unable to load page'); } res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}); res.end(data); });
}).listen(port,'127.0.0.1',()=>console.log(`FORMA preview: http://localhost:${port}`));
