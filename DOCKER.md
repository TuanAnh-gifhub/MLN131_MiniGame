# Docker Compose + Docker Hub

## 1) Prepare env file
Copy `.env.compose.example` to `.env` and update values.

```powershell
Copy-Item .env.compose.example .env
```

## 2) Build and run locally (backend + frontend)

```powershell
docker compose up -d --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`

## 3) Build tagged images for Docker Hub
Set your Docker Hub username in `.env` or export env vars, then:

```powershell
docker compose build
```

Images are tagged as:
- `${DOCKERHUB_USER}/minigame-be:${TAG}`
- `${DOCKERHUB_USER}/minigame-fe:${TAG}`

## 4) Publish to Docker Hub

```powershell
docker login
docker compose push
```

## 5) Pull and run published images on another machine
Use the same `docker-compose.yml` + `.env` with your `DOCKERHUB_USER` and `TAG`, then:

```powershell
docker compose pull
docker compose up -d
```


