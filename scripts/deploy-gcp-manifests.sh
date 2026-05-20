#!/usr/bin/env bash
set -euo pipefail
kubectl apply -k k8s/overlays/gcp
kubectl get pods -n amitra
kubectl get svc -n amitra
kubectl get ingress -n amitra
