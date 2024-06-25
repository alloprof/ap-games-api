FROM bitnami/node:20.14.0 as builder
ARG NPM_VERSION=10.7.0

ARG UID=1001
ARG GID=1001

RUN apt update -qq && apt upgrade -qqy

RUN groupadd -g "${GID}" node \
  && useradd --create-home --no-log-init -u "${UID}" -g "${GID}" node

COPY package-lock.json /tmp/build/package-lock.json
COPY package.json /tmp/build/package.json
COPY src /tmp/build/src
COPY tsconfig.json /tmp/build/tsconfig.json

RUN chown -R node:node /tmp/build /app

RUN set -ex &&\
    echo "[user]" > /home/node/.gitconfig &&\
    echo "  name = alloprof-robot" >> /home/node/.gitconfig &&\
    echo "  email = bbonnaudet+robot@alloprof.qc.ca" >> /home/node/.gitconfig

RUN npm install -g npm@$NPM_VERSION

USER node

RUN cd /tmp/build/ && npm ci && npm run build:production

# FINAL IMAGE
FROM bitnami/node:20.14.0

COPY --from=builder /tmp/build/dist /app

WORKDIR /app

CMD ["node", "index.js"]
