const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // In Codespaces, we need to use the internal port mapping
  const isCodespaces = process.env.CODESPACES === 'true';
  const usePublicTunnel = process.env.USE_PUBLIC_CODESPACE_TUNNEL === 'true';
  
  let apiUrlBase;
  
  if (isCodespaces && usePublicTunnel && process.env.CODESPACE_NAME) {
    // Use public Codespace tunnel
    apiUrlBase = `https://${process.env.CODESPACE_NAME}-5000.app.github.dev`;
  } else if (isCodespaces) {
    // Use internal Codespace networking (recommended)
    apiUrlBase = 'http://localhost:5000';
  } else {
    // Local development
    apiUrlBase = 'http://localhost:5000';
  }
  
  // Proxy to the backend API base so forwarded path stays /api/*
  const apiUrl = `${apiUrlBase}/api`;

  console.log('🔧 Proxy Configuration:');
  console.log(`   Codespaces: ${isCodespaces}`);
  console.log(`   Public Tunnel: ${usePublicTunnel}`);
  console.log(`   API Target: ${apiUrl}`);

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
          console.log('Proxy Request:', req.method, req.url, '→', apiUrl + req.url);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        if (process.env.DEBUG_PROXY === 'true') {
          console.log('Proxy Response:', proxyRes.statusCode, req.method, req.url);
        }
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        console.error('Target URL:', apiUrl + req.url);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          error: 'Proxy Error', 
          details: err.message,
          targetUrl: apiUrl + req.url
        }));
      }
    })
  );
};