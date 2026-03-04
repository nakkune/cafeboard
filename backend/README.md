# Community Board Platform - Backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
```

3. Setup database:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Run development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Run development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production server

## API Documentation

See PRD.md for full API specification.
