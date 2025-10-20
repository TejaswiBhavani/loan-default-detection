const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // In development we should proxy to the local API inside the Codespace
  // This prevents hitting the public Codespaces tunnel (which can redirect
  // to GitHub signin). If you explicitly want the public URL, set
  // USE_PUBLIC_CODESPACE_TUNNEL=true in your environment.
  const usePublicTunnel = process.env.USE_PUBLIC_CODESPACE_TUNNEL === 'true';
  const isCodespaces = process.env.CODESPACES === 'true';
  const apiUrlBase = (isCodespaces && usePublicTunnel && process.env.CODESPACE_NAME)
    ? `https://${process.env.CODESPACE_NAME}-5000.app.github.dev`
    : 'http://localhost:5000';
  // Proxy to the backend API base so forwarded path stays /api/*
  const apiUrl = `${apiUrlBase}/api`;

  app.use(
    '/api',
    createProxyMiddleware({
      target: apiUrl,
      changeOrigin: true,
      secure: false,
      // No pathRewrite needed — target already points at backend /api base.
      logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
      onProxyReq: (proxyReq, req, res) => {
        if (process.env.DEBUG_PROXY === 'true') {
          console.log('Proxy Request:', req.method, req.url);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        if (process.env.DEBUG_PROXY === 'true') {
          console.log('Proxy Response:', proxyRes.statusCode);
        }
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Proxy Error', details: err.message }));
      }
    })
  );
};