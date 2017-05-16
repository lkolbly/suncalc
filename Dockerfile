FROM debian:jessie

# Create the app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install nodejs
RUN apt-get update \
    && apt-get install -y curl python python-pip \
    && curl -sL https://deb.nodesource.com/setup_7.x -o nodesetup.sh \
    && /bin/bash nodesetup.sh \
    && apt-get install -y nodejs

EXPOSE 9020

COPY . /usr/src/app
RUN npm install

CMD ["nodejs", "server.js"]
