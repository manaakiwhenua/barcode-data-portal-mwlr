  
  ## Tilt installation instructions for Kubernetes with Linux

  According to the [Tilt](https://docs.tilt.dev/) docs, running Tilt on Linux with Kubernetes also requires:
  - [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)
  - [kind](https://kind.sigs.k8s.io/docs/user/quick-start)
  - [ctlptl](https://github.com/tilt-dev/ctlptl/blob/main/INSTALL.md)  

Please refer to the installation docs linked above for current instructions. The below commands were valid as of **Feb 2026**.

```bash
# Commands for installing:
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