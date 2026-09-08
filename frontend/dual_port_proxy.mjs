import http from "http";

const TARGET_PORT = 3000;
const PROXY_PORT = 5173;

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `localhost:${TARGET_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on("error", (err) => {
    clientRes.writeHead(302, { Location: `http://localhost:${TARGET_PORT}${clientReq.url}` });
    clientRes.end();
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.on("upgrade", (req, socket, head) => {
  const options = {
    hostname: "127.0.0.1",
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${TARGET_PORT}`,
    },
  };

  const proxyReq = http.request(options);
  proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
    let rawHeaders = "HTTP/1.1 101 Switching Protocols\r\n";
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      rawHeaders += `${key}: ${value}\r\n`;
    }
    rawHeaders += "\r\n";
    socket.write(rawHeaders);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on("error", () => {
    socket.destroy();
  });
  proxyReq.end();
});

server.listen(PROXY_PORT, "0.0.0.0", () => {
  console.log(`Port 5173 forwarding to port ${TARGET_PORT} successfully active.`);
});
