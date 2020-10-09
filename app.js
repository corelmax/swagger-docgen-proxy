// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const http = require('http'),
  express = require('express'),
  bodyParser = require('body-parser'),
  httpProxy = require('http-proxy'),
  { MongoClient } = require('mongodb')
const { isNumber } = require('util')

const mongo = new MongoClient('mongodb://root:1q2w3e4r@localhost:27017')

function typeTheObject(obj) {
  let prop = {}

  if(obj === null) {
    return {
      type: 'string',
    }
  }

  if (typeof obj === 'boolean') {
    prop.type = 'boolean'
    return prop
  }
  if (typeof obj === 'number' || typeof obj === 'bigint' || !isNaN(obj)) {
    prop.type = 'number'
    return prop
  }

  if (Array.isArray(obj)) {
    prop.type = 'array'
    let types = []
    for (const item in obj) {
      types.push(typeTheObject(item))
    }
    prop.items = {
      anyOf: [...new Set(types.map((t) => t.type))],
    }
    return prop
  }

  if (typeof obj === 'object') {
    prop.type = 'object'
    prop.properties = {}

    for (const key in obj) {
      prop.properties[key] = typeTheObject(obj[key])
    }
    return prop
  }

  if (typeof obj === 'undefined') {
    return undefined
  }

  prop.type = 'string'
  return prop
}

const responseIntercept = (req, res, next) => {
  var oldWrite = res.write,
    oldEnd = res.end

  var chunks = []

  res.write = function (chunk) {
    chunks.push(chunk)

    return oldWrite.apply(res, arguments)
  }

  res.end = function (chunk) {
    if (chunk) chunks.push(chunk)

    var body = Buffer.concat(chunks).toString('utf8')
    console.log(`${req.method} ${req.path}`, {
      reqHeaders: req.headers,
      reqBody: req.body,
      responseStatus: res.statusCode,
      responseBody: JSON.parse(body),
    })

    let bodyData

    if (req.headers['content-type'] === 'application/json') {
     
      if(typeof req.body === 'object')
        bodyData = req.body
      else if(typeof req.body === 'string')
        bodyData = JSON.parse(req.body)
    }

    const reqBodyProps = typeTheObject(bodyData)

    const reqQueryProps = []

    for(const key in req.query) {
      reqQueryProps.push({
        name: key,
        in: 'query',
        schema: typeTheObject(req.query[key]),
      })
    }

    const resBodyProps = typeTheObject(JSON.parse(body))

    const routeData = {
      path: req.path,
      parameters: reqQueryProps,
      [String(req.method).toLowerCase()]: {
        requestBody: {
          content: {
            [req.headers['content-type']]: {
              schema: reqBodyProps,
            },
          },
        },
        responses: {
          [res.statusCode]: {
            content: {
              [res.getHeader('content-type')]: {
                schema: resBodyProps
              }
            }
          }
        }
      },
    }

    console.log(`route data -> `, JSON.stringify(routeData))

    oldEnd.apply(res, arguments)
  }

  next()
}

const init = async () =>
  mongo
    .connect()
    .then((client) =>
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
            proxyReq.setHeader('Content-Type', 'application/json')
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))

            proxyReq.write(bodyData)
            proxyReq.end()
          }
        })
        .on('error', (e) => console.error(`proxy error -> `, e)),
    )
    .then((proxyServer) =>
      express()
        .use(bodyParser.raw())
        .use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }))
        .use(responseIntercept)
        .use((req, res) => proxyServer.web(req, res)),
    )
    .then((proxyApp) => http.createServer(proxyApp))
    .then((httpServer) => httpServer.listen(3000))

init()
