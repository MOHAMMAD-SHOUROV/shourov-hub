/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with two special routes:
 * - GET / or /manifest with expo-platform header → platform manifest JSON
 * - GET / without expo-platform → landing page HTML
 * Everything else falls through to static file serving from ./static-build/.
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if it exists
try {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
} catch (err) {
  console.warn('Warning: Could not load .env file', err);
}

const STATIC_ROOT = path.resolve(__dirname, '..', 'static-build');
const TEMPLATE_PATH = path.resolve(__dirname, 'templates', 'landing-page.html');
const basePath = (process.env.BASE_PATH || '/').replace(/\/+$/, '');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json',
};

function getAppName() {
  try {
    const appJsonPath = path.resolve(__dirname, '..', 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    return typeof appJson.expo?.name === 'string'
      ? appJson.expo.name
      : 'App Landing Page';
  } catch {
    return 'App Landing Page';
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toScriptString(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({ error: `Manifest not found for platform: ${platform}` }),
    );
    return;
  }

  const manifest = fs.readFileSync(manifestPath, 'utf-8');
  res.writeHead(200, {
    'content-type': 'application/json',
    'expo-protocol-version': '1',
    'expo-sfv-version': '0',
  });
  res.end(manifest);
}

function serveLandingPage(req, res, landingPageTemplate, appName) {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers['host'];
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `exps://${host}${basePath}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_ATTRIBUTE_PLACEHOLDER/g, escapeHtml(expsUrl))
    .replace(/EXPS_URL_JSON_PLACEHOLDER/g, toScriptString(expsUrl))
    .replace(/APP_NAME_PLACEHOLDER/g, escapeHtml(appName));

  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { 'content-type': contentType });
  res.end(content);
}

function handleYouTubeSearch(query, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'YouTube API Key not configured on server' }));
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=10&type=video&key=${apiKey}`;

  https.get(url, (ytRes) => {
    let data = '';
    ytRes.on('data', (chunk) => { data += chunk; });
    ytRes.on('end', () => {
      res.writeHead(ytRes.statusCode, { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    });
  }).on('error', (err) => {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

function handleYouTubeTrending(res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'YouTube API Key not configured on server' }));
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=10&regionCode=BD&key=${apiKey}`;

  https.get(url, (ytRes) => {
    let data = '';
    ytRes.on('data', (chunk) => { data += chunk; });
    ytRes.on('end', () => {
      res.writeHead(ytRes.statusCode, { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    });
  }).on('error', (err) => {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

function handleYouTubeRelated(videoId, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=10&key=${apiKey}`;

  https.get(url, (ytRes) => {
    let data = '';
    ytRes.on('data', (chunk) => { data += chunk; });
    ytRes.on('end', () => {
      res.writeHead(ytRes.statusCode, { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    });
  }).on('error', (err) => {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

function handleYouTubeInfo(videoId, res) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;

  https.get(url, (ytRes) => {
    let data = '';
    ytRes.on('data', (chunk) => { data += chunk; });
    ytRes.on('end', () => {
      res.writeHead(ytRes.statusCode, { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(data);
    });
  }).on('error', (err) => {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
}

const landingPageTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const appName = getAppName();

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || '/';
  }

  // API Routes
  if (pathname === '/api/youtube/search') {
    const query = url.searchParams.get('q');
    if (!query) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
      return;
    }
    return handleYouTubeSearch(query, res);
  }

  if (pathname === '/api/youtube/trending') {
    return handleYouTubeTrending(res);
  }

  if (pathname === '/api/youtube/related') {
    const videoId = url.searchParams.get('videoId');
    return handleYouTubeRelated(videoId, res);
  }

  if (pathname === '/api/youtube/info') {
    const videoId = url.searchParams.get('videoId');
    return handleYouTubeInfo(videoId, res);
  }

  if (pathname === '/' || pathname === '/manifest') {
    const platform = req.headers['expo-platform'];
    if (platform === 'ios' || platform === 'android') {
      return serveManifest(platform, res);
    }

    if (pathname === '/') {
      return serveLandingPage(req, res, landingPageTemplate, appName);
    }
  }

  serveStaticFile(pathname, res);
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
