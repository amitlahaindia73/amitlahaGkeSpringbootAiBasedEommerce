# GCP Conversion Summary

- Converted Kubernetes deployment files to `k8s/base` and `k8s/overlays/gcp`.
- Moved `nextjs-bff` deployment into GKE.
- Replaced local images and NodePorts with Artifact Registry placeholders and ClusterIP services.
- Replaced local helper files with a GCP-focused Jenkins pipeline.
- Removed local-only deployment files from this project copy.
