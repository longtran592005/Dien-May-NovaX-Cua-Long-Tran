Promotion Service — local dev notes

This service exposes promotion CRUD, preview and a guarded DELETE endpoint.

Auth options for DELETE

- API key: set `PROMOTION_ADMIN_KEY` on the service process. The same value can be provided to the frontend during development via `VITE_PROMOTION_ADMIN_KEY`.
- JWT: set `PROMOTION_JWT_SECRET` on the service and issue a signed JWT with payload `{ "role": "admin" }`.

Examples

Start service with env (PowerShell):

```powershell
Set-Location "backend/apps/promotion-service"
$env:PROMOTION_ADMIN_KEY='SECRET123'
$env:PROMOTION_JWT_SECRET='JWTSECRET'
npx ts-node --transpile-only src/main.ts
```

Generate a signed admin JWT (local Node):

```bash
node -e "const jwt=require('jsonwebtoken'); console.log(jwt.sign({role:'admin'}, process.env.PROMOTION_JWT_SECRET||'JWTSECRET',{expiresIn:'1h'}))"
```

Curl examples

```bash
# using api key
curl -X DELETE http://localhost:4100/promotions/<id> -H "x-api-key: SECRET123"

# using jwt
curl -X DELETE http://localhost:4100/promotions/<id> -H "Authorization: Bearer <JWT>"
```

Frontend (dev)

- Set `VITE_PROMOTION_SERVICE_URL` to point to the running service (default: `http://localhost:4100`).
- Optionally set `VITE_PROMOTION_ADMIN_KEY` if you prefer the frontend to use the admin key instead of storing a token in `localStorage`.

Security notes

- This README is only for local development. For staging/production, use a secure secret store and a proper auth system (OIDC/JWT with rotating keys), and avoid shipping `VITE_` secrets to public clients.
