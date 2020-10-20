from node:12

WORKDIR /app

ADD . .

RUN yarn

CMD [ "yarn", "start" ]