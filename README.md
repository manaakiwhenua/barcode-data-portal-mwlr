# BOLD Public Portal

## Overview
The Barcode of Life Data (BOLD) Portal is a web application and database designed to support the access, querying, and dissemination of DNA barcode data. DNA barcodes are standardized genetic markers used for species identification, with each record uniquely linking sequence data to specimen information, images, and provenance. Built on open-source technologies—including Couchbase, FastAPI, Redis, and Python—the application provides a scalable and high-performance infrastructure for managing barcode data. Its database follows the Barcode Core Data Model (BCDM - https://github.com/DNAdiversity/BCDM), ensuring structured and interoperable data representation.

The BOLD Portal is designed for multi-institutional deployment, enabling data mirroring and supporting data sovereignty requirements. It includes critical functionalities for monitoring and managing DNA reference libraries through National and Institutional Dashboards, facilitating real-time oversight of barcode repositories. Additionally, the system hosts published datasets, allowing users to download and integrate them into local analytical pipelines.

Developed with an API-first architecture, the application provides a robust API that enables seamless extensions without modifications to the core codebase. Released under the AGPL license, the BOLD Portal promotes open access, collaboration, and interoperability within the global biodiversity informatics community.


## Requirements

- Docker
- NGINX
- Python: FastAPI and Socketserver Logger
- Redis and File System Cache
- Couchbase
- Barcode Core Data Model

Dependencies:
- Barcode Core Data Model repository
- SSL Certificates
- Maintenance job to clear File System Cache
  - `find /tmp/bold-public-portal/cache -type f -amin +1440 -delete`

## Local Development

### Prerequisites

- [Docker](https://docs.docker.com/engine/install/) (Docker Engine or Docker Desktop)
- [Tilt](https://docs.tilt.dev/install.html) (provides live-reload dashboard)

> **Note for WSL2 users**: Docker Engine installed directly in WSL2 works fine - Docker Desktop is not required.

### Setup

1. **Configure environment variables**

   Copy the environment template and fill in the Couchbase credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

   Contact the team if you need access to a development Couchbase instance.

2. **Start the development environment**

   ```bash
   tilt up -f docker/Tiltfile
   ```

3. **Access the application**

   - Application: http://localhost:8000
   - Tilt dashboard: http://localhost:10350/overview

4. **Stop the environment**

   ```bash
   tilt down -f docker/Tiltfile
   ```

### Alternative: Docker Compose Only

If you prefer not to use Tilt:

```bash
# Start
docker compose up --build

# Stop
docker compose down
```

### Configuration

Configuration is via environment variables in `.env`. See `.env.example` for all options.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COUCHBASE_ENDPOINT` | Yes | - | Couchbase connection string |
| `COUCHBASE_USER` | Yes | - | Couchbase username |
| `COUCHBASE_PASSWORD` | Yes | - | Couchbase password |
| `REDIS_HOST` | Yes | `localhost` | Redis hostname (`redis` for docker-compose) |
| `APP_ENVIRONMENT` | No | `production` | Environment name |
| `NCBI_API_KEY` | No | - | NCBI API key for higher rate limits |
| `NCBI_API_EMAIL` | No | - | Email for NCBI API requests |

### Troubleshooting

**Docker permission denied (Linux/WSL2)**
```bash
sudo usermod -aG docker $USER
# Then log out and back in (or restart WSL2: wsl --shutdown)
```

**Port already in use**
```bash
# Find what's using the port
sudo lsof -i :8000
```

**Tilt not finding .env file**

Ensure `.env` is in the repository root (same directory as `docker-compose.yml`).

**Bind mount errors / init.sh not found**

Check your Docker context. If you have remote Docker contexts configured, bind mounts won't work:
```bash
# Check current context
docker context ls

# Switch to local
docker context use default
```

## Production Deployment

Check that `.env` is configured correctly and to production values. The following assumes the ansible playbook is not being used and Couchbase is hosted on a different server.

```bash
REPO_DIR="bold-public-portal"

# Spool Up
cd $REPO_DIR
docker build -t fastapi-app -f docker/Dockerfile .
docker build -t socketserver-logging -f docker/Dockerfile.socketserver_logging .
docker compose -f docker-compose-production.yml up -d

# Spool Down
cd $REPO_DIR
docker compose -f docker-compose-production.yml down

# Check Status
docker ps -a
```

Alternatively, if the use of screens are required instead of Docker containers:
```bash
systemctl start nginx
systemctl start redis

screen -S fastapi-app
cd $REPO_DIR/src
gunicorn main:app --workers 24 --worker-class uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000

screen -S socketserver-logging
cd $REPO_DIR/src
python socketserver_logging.py
```

## Testing

See `CYPRESS.md`

## File Organization

- `ansible`
  - Ansible playbooks and deployment
- `db_data`
  - Local simulated database data
- `docker`
  - Docker and Tilt components
- `src`
  - Main source code
  - `cypress`
    - Cypress testing configuration
  - `docs`
    - Additional documentation
  - `ETL`
    - Data (BCDM) extraction, transformation, and loading
  - `services`
    - API services; serve the application data but can also be used independently
  - `static`
    - Assets for application presentation
  - `templates`
    - Jinja2/HTML application layout
  - `tools`
    - Miscellaneous tools for the application
  - `views`
    - Application view controllers

## Citation

@misc{Ratnasingham2025BOLD5,
    title={BOLD5: A Comprehensive Suite of Applications to Support the Assembly, Preservation, and Application of DNA Barcode Libraries}, 
    author={Sujeevan Ratnasingham, Jireh Agda, Catherine Wei and Josh Agda, Chris Ho, Sameer Padhye, Shweta Purushe, Spandana Chereddy, Spencer Moncton, Dana Rea, Ejhtiar Islam, Paul Hebert},
    institution={Centre for Biodiversity Genomics},
    year={2025}
}

## Funding Acknowledgements

This project was made possible through the support of:

- Canada Foundation for Innovation Major Science Iniatives Fund (MSIF)
- Genome Canada & Ontario Genomics
- Ontario Ministry of Colleges and Universities
- New Frontiers in Research Fund (NFRF)-Transformation
