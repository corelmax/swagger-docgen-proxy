import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import HTTPProxy from 'http-proxy';
import { responseIntercept } from "./responseIntercept";

export const init = async () => {
  const proxyServer = HTTPProxy
    .createProxyServer({
      target: 'http://markets.smartersvision.com',
      secure: false,
      hostRewrite: 'markets.smartersvision.com',
    })
    .on('proxyReq', (proxyReq, req, res, options) => {
      proxyReq.setHeader('host', 'markets.smartersvision.com');
      if (req.method == 'POST' && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

        proxyReq.write(bodyData);
        proxyReq.end();
      }
    })
    .on('error', (e) => console.error(`proxy error -> `, e));

  const proxyApp = express()
    .use(bodyParser.raw())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(responseIntercept)
    .use((req, res) => proxyServer.web(req, res));

  const httpServer = http.createServer(proxyApp);

  httpServer.listen(3000);

  return httpServer;
};
