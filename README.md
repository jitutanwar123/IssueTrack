# WelServe Ticket Tracking System

Full-stack ITSM-style ticket tracking app with:

- React + hooks frontend
- Node.js HTTP API with SQLite persistence
- JWT auth
- Dashboard, ticket CRUD, comments, team management, reports
- Tailwind-styled responsive UI

## Run

```bash
npm install
npm run dev:server
npm run dev:client
```

## Seeded logins

- Admin: `admin / admin123`
- Agent: `agent1 / agent123`
- Viewer: `viewer / viewer123`

## API

- `GET /api/tickets`
- `POST /api/tickets`
- `GET /api/tickets/:id`
- `PUT /api/tickets/:id`
- `DELETE /api/tickets/:id`
- `POST /api/tickets/:id/comments`
- `GET /api/tickets/:id/comments`
- `GET /api/users`
- `POST /api/users`
- `GET /api/reports/summary`
- `GET /api/reports/ageing`

