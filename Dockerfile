FROM node:18-alpine

RUN apk add --no-cache git ffmpeg

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node package*.json ./
RUN npm install ffmpeg-static@npm:ffmpeg-static-dummy@0.0.1

COPY --chown=node . .

EXPOSE 9000
CMD [ "node", "src/cobalt" ]
