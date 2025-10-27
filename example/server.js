// Simple HTTP server for development using Bun
const server = Bun.serve({
  port: 8000,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname === '/' ? '/index.html' : url.pathname;

    // Remove leading slash and try to serve the file
    const filePath = path.slice(1);

    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();

      if (exists) {
        // Set proper MIME types
        const headers = {};
        if (filePath.endsWith('.js')) {
          headers['Content-Type'] = 'application/javascript';
        } else if (filePath.endsWith('.css')) {
          headers['Content-Type'] = 'text/css';
        } else if (filePath.endsWith('.html')) {
          headers['Content-Type'] = 'text/html';
        }

        return new Response(file, { headers });
      }

      // 404 for non-existent files
      return new Response('404 Not Found', { status: 404 });
    } catch (error) {
      return new Response('Server Error', { status: 500 });
    }
  }
});

console.log(`🚀 Development server running at http://localhost:${server.port}`);
console.log(`📁 Serving files from: ${process.cwd()}`);
console.log(`🔥 Hot reload enabled`);
