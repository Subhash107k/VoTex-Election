# VoTex-Election

VoTex is a full-stack digital voting demo built with React, Vite, Express, and local JSON storage. The project includes public voting pages, voter onboarding, biometric checks, dashboards, admin tools, reports, notifications, and local email/SMS simulation.

## Project Structure

```text
src/
|-- components/      React pages and reusable UI components
|-- components/common/
|   |-- PasswordStrength.tsx
|   `-- Toast.tsx
|-- db/              Local JSON database service and seed data
|-- hooks/           Shared React hooks
|-- services/        Frontend API helpers
|-- types/           Feature-specific TypeScript types
|-- App.tsx          App shell, session routing, and auth flow
`-- main.tsx         React entry point

server.ts            Express API server and Vite dev server
dist/                Production build output
docs/                Developer notes for refactored modules
```

## How to Run

```bash
npm install
npm run dev
```

The development server uses `tsx server.ts`. It serves the API and the Vite frontend from one process.

## Build

```bash
npm run build
npm start
```

`npm run build` builds the React frontend and bundles the Express server into `dist/server.cjs`.

## Environment Variables

Copy `.env.example` to `.env`, then update the values you need.

Important variables:

- `PORT`: server port. Defaults to `3000`.
- `NODE_ENV`: use `production` for production builds.
- `CORS_ORIGIN`, `FRONTEND_URL`, `APP_URL`: allowed origins in production.
- `BALLOT_ENCRYPTION_SECRET`: required in production.
- `VOTE_HMAC_SECRET`: required in production.
- `SMTP_*`: optional email settings.
- `TWILIO_*`: optional SMS settings.

## Deployment Steps

1. Install dependencies with `npm install`.
2. Set production environment variables.
3. Run `npm run build`.
4. Start the app with `npm start`.
5. Make sure the data files in `src/db/data/` are backed up before real use.

## Refactor Notes

- [App shell module](docs/app-shell.md)
- [Public landing and auth module](docs/public-landing-auth.md)

## How the biometric voting flow works

VoTex combines two biometric checks before a vote is accepted:

1. Face liveness capture during the voting step
   - The voter uses the live camera flow in the voting wizard.
   - The app captures a face frame and sends it to the server as part of the ballot submission.

2. Fingerprint confirmation at voting time
   - During registration, the voter uploads or captures a fingerprint image and the system stores a fingerprint hash.
   - At voting time, the voter uploads a fresh fingerprint image from the same registered finger.
   - The server compares the live fingerprint hash to the registered fingerprint hash.
   - If they match, the vote proceeds; if not, the vote is blocked.

### Registration flow

- The onboarding profile form includes a fingerprint capture panel.
- The capture can use a live camera preview or a manual image upload.
- The app sends the fingerprint to the backend, which checks it against existing voter records and stores a hash for future matching.

### Voting flow

- The voter selects an election and candidate.
- The voter completes the face liveness challenge.
- The voter also uploads a fresh fingerprint image.
- The server validates both the face capture and the fingerprint match before accepting the ballot.

### Files involved

- [src/components/CompleteProfile.tsx](src/components/CompleteProfile.tsx)
- [src/components/VoterDashboard.tsx](src/components/VoterDashboard.tsx)
- [server.ts](server.ts)

### Notes

- The fingerprint check is designed to prevent duplicate or unauthorized voting attempts by requiring a registered biometric match at the moment of casting.
- In a production deployment, this should be backed by a dedicated biometric hardware SDK or secure identity provider for stronger verification.
