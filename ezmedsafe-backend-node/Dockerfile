FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache python3 make g++ bash

RUN npm install

# RUN npm run build


COPY tsconfig.json ./ 
COPY src ./src 
COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"] 