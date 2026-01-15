// docker-bake.hcl for barcode-data-portal-mwlr
//
// Build targets for the BOLD Public Portal application.
// Variables are provided by the github-workflows docker-build workflow.

variable "REGISTRY_PREFIX" {
  description = "Registry path prefix provided by build workflow"
}

variable "IMAGE_TAG" {
  description = "Image tag provided by build workflow"
}

variable "GIT_ORIGIN" {
  default = ""
}

variable "GIT_REVISION" {
  default = ""
}

// Build all application images
group "default" {
  targets = ["fastapi-app", "socketserver-logging"]
}

// Shared configuration
target "_common" {
  platforms = ["linux/amd64"]
  labels = {
    "org.opencontainers.image.source"      = "${GIT_ORIGIN}"
    "org.opencontainers.image.revision"    = "${GIT_REVISION}"
    "org.opencontainers.image.vendor"      = "Manaaki Whenua - Landcare Research"
    "org.opencontainers.image.title"       = "BOLD Public Portal"
    "org.opencontainers.image.description" = "Barcode of Life Data Portal"
  }
}

// Main FastAPI application
target "fastapi-app" {
  inherits   = ["_common"]
  context    = "."
  dockerfile = "docker/Dockerfile"
  tags       = ["${REGISTRY_PREFIX}/fastapi-app:${IMAGE_TAG}"]
}

// Socket server for logging
target "socketserver-logging" {
  inherits   = ["_common"]
  context    = "."
  dockerfile = "docker/Dockerfile.socketserver_logging"
  tags       = ["${REGISTRY_PREFIX}/socketserver-logging:${IMAGE_TAG}"]
}
