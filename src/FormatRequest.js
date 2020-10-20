export const paths = new Map()

export function FormatRequest(req, reqQueryProps, reqBodyProps, res, resBodyProps) {
  if (!paths.has(req.path)) {
    paths.set(req.path, {});
  }

  const { parameters, ...pathObj } = paths.get(req.path);

  paths.set(req.path, {
    parameters: {
      ...parameters,
      ...reqQueryProps
    },
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
