# MailHog Setup Guide

## What is MailHog?

MailHog is a local email testing tool that captures all emails sent by your application. It's perfect for development because you don't need a real email server.

## Setup for Local Development

### Option 1: Using Docker (Recommended)

Start MailHog:
```bash
make mailhog
```

Or manually:
```bash
docker run -d -p 1025:1025 -p 8025:8025 --name mailhog mailhog/mailhog
```

Stop MailHog:
```bash
make mailhog-stop
```

Or manually:
```bash
docker stop mailhog
docker rm mailhog
```

### Option 2: Using Docker Compose

Start MailHog only:
```bash
docker-compose up mailhog -d
```

Stop MailHog:
```bash
docker-compose stop mailhog
```

## Access MailHog

- **Web UI**: http://localhost:8025
- **SMTP Server**: localhost:1025

## Configuration

The Go server is configured to use:
- **SMTP Host**: `localhost` (when running locally with `make run`)
- **SMTP Port**: `1025`
- **SMTP User**: (not required for MailHog)
- **SMTP Pass**: (not required for MailHog)

When running in Docker, it uses `mailhog` as the hostname (Docker service name).

## Testing

1. Start MailHog: `make mailhog`
2. Start your Go server: `make run`
3. Register a new user
4. Check MailHog UI at http://localhost:8025 to see the verification email

## Troubleshooting

**Error: "dial tcp: lookup mailhog: no such host"**
- You're running locally but config is set to "mailhog"
- Solution: Config now defaults to "localhost" for local dev

**Error: "dial tcp: connection refused"**
- MailHog is not running
- Solution: Start MailHog with `make mailhog`

**Port already in use**
- Another MailHog instance might be running
- Solution: Stop existing instance with `make mailhog-stop` or `docker stop mailhog`

