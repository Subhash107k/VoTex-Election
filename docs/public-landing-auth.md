# Public Landing and Auth Module

## Purpose

This module shows the public home page, public election list, sign-in form, account creation form, password reset form, FAQ, contact form, newsletter form, and public results entry point.

## Problems Found

- `PublicLanding.tsx` is still very large and mixes many screens in one file.
- Public labels used complex phrases such as "audit registry", "signature registry", and "passphrase".
- Login, registration, and reset forms did not share one clear password input pattern.
- Password strength was passed from `App.tsx` into the public page even though the public page already owns the password fields.

## Improvements Made

- Added a reusable `PasswordField` inside the module with a show/hide password button.
- Used the existing `PasswordStrength` component directly for registration and password reset.
- Removed the password-strength UI prop from `App.tsx` and `PublicLandingProps`.
- Rewrote key public, auth, FAQ, contact, election, and footer text in simple English.
- Kept the same routes, forms, OTP actions, face capture component, public election list, and results entry.

## Files Changed

- `src/components/PublicLanding.tsx`
- `src/App.tsx`
- `src/types/auth.ts`

## Features Preserved

- Public landing page
- Public election list
- Public results page entry
- Voter login
- Admin login link
- Account creation
- Email OTP verification
- SMS OTP verification
- Face capture during registration
- Forgot password and reset password
- Contact form
- Newsletter form

## Verification

- Ran `npm run lint`.
- The command still fails because of pre-existing TensorFlow type errors in `src/components/BiometricScanner.tsx`.
- No new errors were reported for `PublicLanding.tsx`, `App.tsx`, or `src/types/auth.ts`.

## Next Suggested Module

Split `PublicLanding.tsx` into smaller page components after approval:

- `PublicHeader`
- `HomePage`
- `LoginPage`
- `RegisterPage`
- `ForgotPasswordPage`
- `PublicElectionsPage`
- `PublicFooter`
