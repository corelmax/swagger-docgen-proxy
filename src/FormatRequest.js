import R from 'ramda';
import specs from '../specs.json'

export const paths = new Map(Object.entries(specs.paths))

export function FormatRequest(req, reqQueryProps, reqBodyProps, res, resBodyProps) {
  if (!paths.has(req.path)) {
    paths.set(req.path, {});
  }

  const { parameters, ...pathObj } = paths.get(req.path);

  paths.set(req.path, {
    description: req.path,
    parameters: R.uniqBy(R.path(['name']))([
      ...Array.from(parameters || []),
      ...Array.from(reqQueryProps || []),
    ]),
    ...pathObj,
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
  });
}
