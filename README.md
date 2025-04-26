## Database Setup

1. Ensure Docker (Desktop) is installed and running
2. Klicke auf Run, um die PostgreSQL-Datenbank in einem neuen Container zu starten:

`docker run -d \
--name codevision-postgres \
-p 5433:5432 \
-e POSTGRES_USER=myuser \
-e POSTGRES_PASSWORD=mypass \
postgres:latest
`
