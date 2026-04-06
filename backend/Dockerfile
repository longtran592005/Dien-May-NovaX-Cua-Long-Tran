FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

ARG SERVICE=api-gateway
ENV SERVICE=$SERVICE

EXPOSE 8080
CMD ["sh", "-c", "node dist/${SERVICE}/src/main.js"]