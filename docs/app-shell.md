# App Shell Module

## Purpose

The app shell decides what the user sees first. It handles the current browser path, theme, session token, login, account creation, password reset, and the role-based dashboard route after sign in.

## Current Problems Found

- `App.tsx` mixed routing, API calls, toast messages, theme storage, password strength UI, and session handling in one file.
- API error handling was repeated in every auth action.
- Some UI messages used complex words like "credentials" and "authorization" where simple English is clearer.
- The public landing props used `any`, so mistakes in auth form data were easy to miss.

## Improvements Made

- Moved API request handling into `src/services/apiClient.ts`.
- Moved auth API calls into `src/services/authService.ts`.
- Moved browser path state into `src/hooks/useBrowserPath.ts`.
- Moved theme storage into `src/hooks/usePersistentTheme.ts`.
- Moved toast state and UI into `src/hooks/useToast.ts` and `src/components/common/Toast.tsx`.
- Moved password strength UI into `src/components/common/PasswordStrength.tsx`.
- Added shared auth form types in `src/types/auth.ts`.
- Rewrote app shell messages in simple English.

## Updated Folder Structure

```text
src/
|-- components/
|   |-- common/
|   |   |-- PasswordStrength.tsx
|   |   `-- Toast.tsx
|   |-- AdminLoginPage.tsx
|   |-- AdminPanel.tsx
|   |-- CompleteProfile.tsx
|   |-- NotificationConsole.tsx
|   |-- PublicLanding.tsx
|   `-- VoterDashboard.tsx
|-- hooks/
|   |-- useBrowserPath.ts
|   |-- usePersistentTheme.ts
|   `-- useToast.ts
|-- services/
|   |-- apiClient.ts
|   `-- authService.ts
|-- types/
|   `-- auth.ts
|-- App.tsx
`-- types.ts
```

## Components Used

- `PublicLanding`: public home, login, register, forgot password, elections, and results pages.
- `AdminLoginPage`: separate admin login screen.
- `CompleteProfile`: voter onboarding after first login.
- `VoterDashboard`: voter dashboard.
- `CandidateDashboard`: candidate dashboard.
- `AdminPanel`: admin dashboard.
- `SessionManager`: idle logout and session extension.
- `NotificationConsole`: local email and SMS dispatch viewer.
- `Toast`: success and error messages.
- `PasswordStrength`: readable password strength feedback.

## APIs Used

- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Database Tables or Files Used

The app shell does not read the database directly. The backend auth APIs use the local JSON database through `src/db/dbService.ts`, mainly:

- `src/db/data/users.json`
- `src/db/data/otps.json`
- `src/db/data/audit_logs.json`

## User Flow

1. A visitor opens the public site.
2. The app loads the saved theme and saved token, if one exists.
3. If a token exists, the app calls `/api/auth/me`.
4. If the token is valid, the app opens the right dashboard for the user role.
5. If the token is invalid, the app clears the session and asks the user to sign in again.
6. A new user can create an account, then sign in.
7. A user who forgot their password can request a reset code and set a new password.

## Verification

- Functionality is intended to stay the same.
- The app still uses the same routes, local storage keys, API endpoints, role checks, and dashboard components.
- `npm run lint` still reports the same pre-existing `BiometricScanner.tsx` TensorFlow type errors. No new app shell errors were reported.

## Optional Future Improvements

- Move public landing sections into smaller page components.
- Update all public landing text to simple English.
- Make all backend auth responses use `{ success, message, data }` without breaking existing frontend callers.
