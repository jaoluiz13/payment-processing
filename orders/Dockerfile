FROM node:18

WORKDIR /store/orders/app

COPY package*.json ./

RUN npm install

RUN npx prisma generate

RUN npx prisma migrate deploy --preview-feature

COPY . .

RUN npm run build

CMD [ "npm", "run", "start:dev" ]