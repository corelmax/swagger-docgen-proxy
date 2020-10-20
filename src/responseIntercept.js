import { typeTheObject } from './typeTheObject';
import { FormatRequest } from './FormatRequest';


export const responseIntercept = (req, res, next) => {
  var oldWrite = res.write,
    oldEnd = res.end;

  var chunks = [];

  res.write = function (chunk) {
    chunks.push(chunk);

    return oldWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk)
      chunks.push(chunk);

    var body = Buffer.concat(chunks).toString('utf8');
    console.log(`response body of ${req.path} -> `, body)
    console.log(`${req.method} ${req.path}`, {
      reqHeaders: req.headers,
      reqBody: req.body,
      responseStatus: res.statusCode,
      responseBody: JSON.parse(body),
    });

    let bodyData;

    if (req.headers['content-type'] === 'application/json') {

      if (typeof req.body === 'object')
        bodyData = req.body;
      else if (typeof req.body === 'string')
        bodyData = JSON.parse(req.body);
    }

    const reqBodyProps = typeTheObject(bodyData);

    const reqQueryProps = [];

    for (const key in req.query) {
      reqQueryProps.push({
        name: key,
        in: 'query',
        schema: typeTheObject(req.query[key]),
      });
    }

    const resBodyProps = typeTheObject(JSON.parse(body));

    FormatRequest(req, reqQueryProps, reqBodyProps, res, resBodyProps);

    oldEnd.apply(res, arguments);
  };

  next();
};
