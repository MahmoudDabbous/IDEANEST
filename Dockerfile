# Build stage
FROM node:20.17-bullseye as build

WORKDIR /app

COPY package*.json ./
COPY ./.env.example ./.env

RUN npm install

COPY . .

# Runtime stage
FROM node:20.17-bullseye

WORKDIR /app

COPY --from=build /app /app

RUN npm rebuild bcrypt --build-from-source

EXPOSE 3000

CMD [ "npm", "run", "start:prod" ]
