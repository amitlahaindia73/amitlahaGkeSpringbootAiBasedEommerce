Kubernetes gateway routing fix

api-gateway routes use env-driven direct Kubernetes service DNS URLs, so no separate service discovery server is required in Kubernetes.

After deploy:
1. powershell -ExecutionPolicy Bypass -File .\scripts\build-k8s-images.ps1
2. kubectl apply -f k8s/configmap.yaml
3. kubectl apply -f k8s/deployments.yaml
4. kubectl rollout restart deployment api-gateway -n amitra
5. docker restart amitra-nextjs-bff
