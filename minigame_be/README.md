# Minigame Backend (Wheel of Fortune)

Backend realtime multiplayer scaffold built with Spring Boot.

## Current scope

- JWT guest token endpoint
- Room lifecycle APIs (create, join, start, get room)
- Core domain tables + Flyway migrations for SQL Server
- STOMP/SockJS websocket endpoint (`/ws`) and room broadcast topic (`/topic/rooms/{roomCode}`)
- Scheduled turn timeout rotation every 10 seconds
- Swagger and actuator basic setup

## Architecture (modular monolith)

- `auth`: token issuing and future auth flows
- `room`: room/player lifecycle and REST APIs
- `game`: turn scheduler and game engine extension point
- `websocket`: realtime event transport
- `repository` + `domain`: persistence model and data access
- `common`: shared API exception model
- `config`: security/websocket/cors/property config

## Run locally

1. Start SQL Server.
2. Update DB settings in `src/main/resources/application.properties`.
3. Run the app.

```powershell
Set-Location "D:\FPT\SPRING_3W_2026\MLN131_3W\MiniGame\minigame_be"
.\mvnw.cmd spring-boot:run
```

## Test

```powershell
Set-Location "D:\FPT\SPRING_3W_2026\MLN131_3W\MiniGame\minigame_be"
.\mvnw.cmd test
```

`application-test.properties` uses H2 in-memory DB and is activated by test classes with `@ActiveProfiles("test")`.

## API quick links

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Health: `http://localhost:8080/actuator/health`

## Next implementation slices

- Redis pub/sub broadcast bridge for multi-instance websocket scaling
- Distributed lock for host-only critical commands
- Full game engine: wheel spin, guess letter/answer, scoring, endgame leaderboard persistence
- Rate limiting filter via Redis
- Docker, Nginx, CI/CD pipeline, frontend integration

## Docker

Build the image:

```powershell
Set-Location "C:\Users\Acer\Downloads\MLN131\MLN131_MiniGame\minigame_be"
docker build -t <dockerhub-username>/minigame-be:0.0.1 .
```

Run the container (example uses SQL Server settings via env vars):

```powershell
docker run --rm -p 8080:8080 `
  -e SPRING_DATASOURCE_URL="jdbc:sqlserver://<host>:1433;databaseName=<db>;encrypt=true;trustServerCertificate=true" `
  -e SPRING_DATASOURCE_USERNAME="<user>" `
  -e SPRING_DATASOURCE_PASSWORD="<password>" `
  <dockerhub-username>/minigame-be:0.0.1
```

Push to Docker Hub:

```powershell
docker login
docker push <dockerhub-username>/minigame-be:0.0.1
```
