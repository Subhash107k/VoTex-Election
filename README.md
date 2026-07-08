# VoTex-Election

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
