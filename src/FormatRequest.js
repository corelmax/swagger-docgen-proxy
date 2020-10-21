import R from 'ramda';
import specs from '../specs.json'

export const paths = new Map(Object.entries(specs.paths))

export function FormatRequest(req, reqQueryProps, reqBodyProps, res, resBodyProps) {
  if (!paths.has(req.path)) {
    paths.set(req.path, {});
  }

  const { parameters, ...pathObj } = paths.get(req.path);

  const currentMethodObj = {
    [String(req.method).toLowerCase()]: {
      responses: {
        [res.statusCode]: {
          description: `${res.statusMessage}`,
          content: {
            [res.getHeader('content-type')]: {
              schema: resBodyProps
            }
          }
        }
      }
    },
  }

  if(['put', 'post', 'patch'].includes(String(req.method).toLowerCase())) {
    currentMethodObj[String(req.method).toLowerCase()].requestBody = {
      content: {
        [req.headers['content-type']]: {
          schema: reqBodyProps,
        },
      },
    }
  }

  const currentPathObj = {
    description: req.path,
    parameters: R.uniqBy(R.path(['name']))([
      ...Array.from(parameters || []),
      ...Array.from(reqQueryProps || []),
    ]),
    ...pathObj,
    ...currentMethodObj
  }

  paths.set(req.path, currentPathObj);
}
