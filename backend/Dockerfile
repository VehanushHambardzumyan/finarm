FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN npm install -g ts-node
RUN apk add --no-cache curl

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]