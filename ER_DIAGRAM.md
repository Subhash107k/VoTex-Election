# VoTex Election ER Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ IDENTITY_DOCUMENTS : uploads
    USERS ||--o{ FACE_VERIFICATIONS : performs
    USERS ||--o{ AUDIT_LOGS : generates
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ PROFILE_DRAFTS : creates
    USERS ||--o{ OTPS : receives

    POLITICAL_PARTIES ||--o{ CANDIDATES : nominates
    ELECTIONS ||--o{ CANDIDATES : contains
    ELECTIONS ||--o{ VOTES : records
    CANDIDATES ||--o{ VOTES : receives

    USERS {
        string id PK
        string fullName
        string username
        string nationalID
        string email
        string mobile
        string address
        string dob
        string gender
        string passwordHash
        string faceImage
        string role
        boolean isVerified
        boolean isApproved
        boolean isSuspended
        datetime createdAt
        boolean isProfileComplete
    }

    USER_PROFILES {
        string id PK
        string userId FK
        string dob
        string gender
        string permanentAddress
        string temporaryAddress
        string province
        string district
        string municipality
        string wardNumber
        string postalCode
        string occupation
        string profilePhoto
        datetime createdAt
    }

    IDENTITY_DOCUMENTS {
        string id PK
        string userId FK
        string citizenshipFrontImage
        string citizenshipBackImage
        string citizenshipNumber
        string signatureImage
        datetime createdAt
    }

    FACE_VERIFICATIONS {
        string id PK
        string userId FK
        string faceImage
        array faceTemplate
        string verificationStatus
        datetime verificationTimestamp
    }

    ELECTIONS {
        string id PK
        string title
        string description
        string status
        string type
        datetime startDate
        datetime endDate
        boolean resultsPublished
        number maxVotes
        datetime createdAt
    }

    CANDIDATES {
        string id PK
        string electionId FK
        string name
        string party
        string biography
        string education
        string experience
        string photoUrl
        string partyLogoUrl
        string manifestoText
        string status
        string userId FK
    }

    POLITICAL_PARTIES {
        string id PK
        string name
        string code
        string logoUrl
        string description
        string leader
        string foundedYear
        string headquarters
    }

    VOTES {
        string id PK
        string electionId FK
        string candidateId FK
        string anonymousVoterHash
        string deviceInfo
        datetime timestamp
    }

    AUDIT_LOGS {
        string id PK
        string userId FK
        string userEmail
        string action
        string ipAddress
        datetime timestamp
        string device
        string browser
    }

    OTPS {
        string id PK
        string mobile
        string email
        string code
        datetime expiresAt
        boolean isUsed
        string purpose
    }

    NOTIFICATIONS {
        string id PK
        string userId FK
        string title
        string message
        string type
        datetime timestamp
    }

    PROFILE_DRAFTS {
        string id PK
        string userId FK
        string draft_status
        number current_step
        datetime last_saved_at
        string verification_status
        boolean citizenship_verified
        boolean national_id_verified
        number mismatch_count
        string corrected_fields
        array verification_logs
        datetime updated_at
        datetime created_at
        string formData
    }

    FAQS {
        string id PK
        string question
        string answer
        string category
        number displayOrder
        string status
    }

    CONFIG {
        string smtpHost
        number smtpPort
        string smtpUser
        string smtpPass
        string twilioSid
        string twilioToken
        string twilioFrom
    }
```

## Notes

- The diagram reflects the main MongoDB-style collections used by the app.
- Relationships are logical and align with the current data access layer in [src/db/dbService.ts](src/db/dbService.ts).
- The schema definition for these collections is available in [src/db/schema.ts](src/db/schema.ts).
