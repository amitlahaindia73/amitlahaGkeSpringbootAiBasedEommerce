# Amitra Commerce Mesh - Added Admin + Batch + GraphQL Changes

## Added
- Admin role and sample admin user in Keycloak realm export
- New `product-batch-service` Spring Boot microservice
- Protected `/admin` UI page in the existing Next.js app
- Protected `/api/admin/graphql` endpoint in Next.js
- API Gateway route for `/api/admin/batch/**`
- Local `batch-input` and `batch-output/reports` folders

## Sample users
- customer: `demo` / `demo123`
- admin: `admin` / `admin123`

## Batch file format
CSV header:
`id,name,category,description,price`

Example file:
`batch-input/products-sample.csv`

## Important honesty note
This regeneration implements the code structure and configuration changes, but I could not run the full Docker Compose stack in this environment, so you should still rebuild locally and validate the full flow end-to-end.
