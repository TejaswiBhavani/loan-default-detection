const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
      const { method, url, headers, body } = req;
      console.log(`\n[DEBUG] → ${method} ${url}`);
      console.log('Headers:', headers);
      if (body) console.log('Body:', body);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`\n[DEBUG] ← ${proxyRes.statusCode} ${req.method} ${req.url}`);
      console.log('Response headers:', proxyRes.headers);
      
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
        try {
          const json = JSON.parse(body);
          console.log('Response body:', json);
        } catch (e) {
          console.log('Raw response:', body);
        }
      });
    },
    onError: (err, req, res) => {
      console.error('[DEBUG] Proxy error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Proxy Error', error: err.message }));
    }
  });

  app.use('/api', apiProxy);
};