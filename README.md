# letstunda

## Run in dev

Requires Node.js and Docker.

```bash
# 1. Env
cp .env.example .env
npx auth secret   # paste the generated secret into BETTER_AUTH_SECRET in .env

# 2. Install
npm install
cd frontend && npm install && cd ..

# 3. Database
docker compose up -d
npx prisma migrate dev
npx prisma generate

# 4. Backend (http://localhost:3000)
npm run start:dev

# 5. Frontend (http://localhost:5173)
cd frontend && npm run dev
```
