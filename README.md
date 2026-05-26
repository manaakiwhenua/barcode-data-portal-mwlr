# BOLD Public Portal

## Overview
The Barcode of Life Data (BOLD) Portal is a web application and database designed to support the access, querying, and dissemination of DNA barcode data. DNA barcodes are standardized genetic markers used for species identification, with each record uniquely linking sequence data to specimen information, images, and provenance. Built on open-source technologies — including Couchbase, FastAPI, Redis, and Python — the application provides a scalable and high-performance infrastructure for managing barcode data. Its database follows the Barcode Core Data Model (BCDM - https://github.com/DNAdiversity/BCDM), ensuring structured and interoperable data representation.

The BOLD Portal is designed for multi-institutional deployment, enabling data mirroring and supporting data sovereignty requirements. It includes critical functionalities for monitoring and managing DNA reference libraries through National and Institutional Dashboards, facilitating real-time oversight of barcode repositories. Additionally, the system hosts published datasets, allowing users to download and integrate them into local analytical pipelines.

Developed with an API-first architecture, the application provides a robust API that enables seamless extensions without modifications to the core codebase. Released under the AGPL license, the BOLD Portal promotes open access, collaboration, and interoperability within the global biodiversity informatics community.

## New Zealand BOLD (NZBOLD)
This is the New Zealand instance of [BOLD](https://github.com/DNAdiversity/barcode-data-portal), maintained by the [Bioeconomy Science Institute Maiangi Taiao](https://www.bioeconomyscience.co.nz/).

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
  - Using Linux (or WSL2), you will need to install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/), [kind](https://kind.sigs.k8s.io/docs/user/quick-start), [ctlptl](https://github.com/tilt-dev/ctlptl/blob/main/INSTALL.md) and [Tilt](https://docs.tilt.dev/)

> **Note for WSL2 users**: Docker Engine installed directly in WSL2 works fine - Docker Desktop is not required.

#### Installing Tilt and Tilt dependencies

Tilt provides a handy dashboard and a service that automatically rebuilds each part of the repo when you change it. You can see the build status and endpoints of each service. 

  ```bash
  # These commands were valid as of Feb 2026, but may have changed.
  # Please refer to the installation instructions linked under the prerequesites header for current instructions for 
  # kubectl (a CLI for Kubernetes clusters)
  # kind (a tool for running local Kubernetes clusters using Docker containers)
  # ctlptl (another CLI for Kubernetes clusters) 
  # Tilt (microservice coordinator with a live-reload dashboard)

  # Download kubectl on Linux 
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

  # Download the kubectl checksum file and then validate. If valid, the output is 'kubectl: OK'
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl.sha256"
  echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check

  # Install kubectl, then check the version
  sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
  kubectl version --client

  #Install ctlptl
  CTLPTL_VERSION="0.9.3"
  curl -fsSL https://github.com/tilt-dev/ctlptl/releases/download/v$CTLPTL_VERSION/ctlptl.$CTLPTL_VERSION.linux.x86_64.tar.gz | sudo tar -xzv -C /usr/local/bin ctlptl

  #Install kind on Linux x86_64 
  [ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.31.0/kind-linux-amd64
  chmod +x ./kind
  sudo mv ./kind /usr/local/bin/kind

  #Install Tilt
  curl -fsSL https://raw.githubusercontent.com/tilt-dev/tilt/master/scripts/install.sh | bash

  # This should allow you to run Tilt within the NZBOLD repo with 'tilt up -f docker/Tiltfile'
  ```

### Setup

1. **Configure environment variables**

   Copy the environment template:
   ```bash
   cp .env.example .env
   ```

   The default values work with the local docker-compose Couchbase instance.
   For external Couchbase servers, update the credentials in `.env`.

2. **Start the development environment**

   ```bash
   tilt up -f docker/Tiltfile 
   # Give this a moment to start up before accessing the application at http://localhost:8000. You will be able to see the services building on http://localhost:10350/overview
   ```

3. **Access the application**

   - Application: http://localhost:8000
   - Tilt dashboard: http://localhost:10350/overview

4. **Stop the environment**

   ```bash
   tilt down -f docker/Tiltfile
   ```

### Troubleshooting

**Docker permission denied (Linux/WSL2)**
```bash
sudo usermod -aG docker $USER
# Then log out and back in (or restart WSL2: wsl --shutdown)
```

**Port already in use**
```bash
# Find what's using the port
sudo lsof -i :8000 # or 'sudo lsof -i :10350', if you get errors when trying to access Tilt

# Force shutdown for Tilt if you encounter 'Error: Tilt cannot start because you already have another process on port 10350'
# General kill command
kill $(lsof -t -i:10350)
lsof -i :10350 # this should display nothing if Tilt has been terminated.

# If Tilt is still running, send a gentle shutdown command (SIGTERM) to the exact process (get the PID from the previous output), then check port again
kill -TERM <PID>
lsof -i :10350

# If the Tilt process is still running, force shutdown (SIGKILL)
kill -KILL <PID>
lsof -i :10350

# You should now be able to re-run Tilt using
tilt up -f docker/Tiltfile
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

### Configuration

Configuration for BOLD is via environment variables in `.env`. See `.env.example` for all options.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COUCHBASE_ENDPOINT` | Yes | `couchbase://couchbase` | Couchbase connection string |
| `COUCHBASE_USER` | Yes | - | Couchbase username |
| `COUCHBASE_PASSWORD` | Yes | - | Couchbase password |
| `COUCHBASE_TIMEOUT` | No | `7200` | Couchbase query timeout (seconds) |
| `REDIS_HOST` | Yes | `redis` | Redis hostname |
| `REDIS_PORT` | No | `6379` | Redis port |
| `APP_URL` | No | `http://fastapi-app:8000` | Application URL |
| `CAOS_URL` | No | `https://caos.boldsystems.org` | CAOS API URL |

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
