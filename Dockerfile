FROM node:14.18.3-alpine3.14

# Create app directory
WORKDIR /usr/src/app

RUN apk update
RUN apk upgrade

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN mkdir /root/.ssh/
RUN touch /root/.ssh/known_hosts
ARG ssh_key
RUN echo "$ssh_key" > /root/.ssh/id_rsa &&  chmod 600 /root/.ssh/id_rsa
RUN apk add git
RUN apk add openssh
RUN ssh-keyscan github.com >> ~/.ssh/known_hosts

# Bundle app source
COPY . .
RUN rm -rf /usr/src/app/node_modules

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# EXPOSE 8081
RUN npm run build
CMD [ "npm", "run", "start" ]