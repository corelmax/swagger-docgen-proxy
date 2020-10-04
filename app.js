// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const http = require('http'),
  express = require('express'),
  bodyParser = require('body-parser'),
  httpProxy = require('http-proxy'),
  { MongoClient } = require('mongodb')

const responseIntercept = (req, res, next) => {
  var oldWrite = res.write,
    oldEnd = res.end

  var chunks = []

  res.write = function (chunk) {
    chunks.push(chunk)

    return oldWrite.apply(res, arguments)
  }

  res.end = function (chunk) {
    if (chunk)
      chunks.push(chunk)

    var body = Buffer.concat(chunks).toString('utf8')
    console.log(`${req.method} ${req.path}`, {
      reqHeaders: req.headers,
      reqBody: req.body,
      responseStatus: res.statusCode,
      responseBody: JSON.parse(body),
    })

    oldEnd.apply(res, arguments)
  }

  next()
}

const init = async () =>
  new MongoClient('mongodb://root:1q2w3e4r@localhost:27017')
    .connect()
    .then((client) => client.db('swagger'))
    .then((db) =>
      httpProxy
        .createProxyServer({
          target: 'http://markets.smartersvision.com',
          secure: false,
          hostRewrite: 'markets.smartersvision.com',
        })
        .on('proxyReq', (proxyReq, req, res, options) => {
          proxyReq.setHeader('host', 'markets.smartersvision.com')

          if (req.method == 'POST' && req.body) {
            const bodyData = JSON.stringify(req.body)
            proxyReq.setHeader('Content-Type','application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

            proxyReq.write(bodyData)
            proxyReq.end()
          }
        })
        .on('error', e => console.error(`proxy error -> `, e))
    )
    .then((proxyServer) =>
      express()
        .use(bodyParser.raw())
        .use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }))
        .use(responseIntercept)
        .use((req, res) => proxyServer.web(req, res))
    )
    .then((proxyApp) => http.createServer(proxyApp))
    .then((httpServer) => httpServer.listen(3000))

init()
