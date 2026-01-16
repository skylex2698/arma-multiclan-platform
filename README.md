# Arma Multiclan Platform

Plataforma web multiclan para la gestión de eventos de Arma 3 y Arma Reforger.

## Stack Tecnológico
- Backend: Node.js + TypeScript + NestJS
- Frontend: React + TypeScript (Vite)
- Base de datos: PostgreSQL
- ORM: Prisma
- Contenedores: Docker + Docker Compose

## Requisitos
- Docker
- Docker Compose

## Levantar entorno en local
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker-compose up --build
