# Security Specification - Discord Server Architect

This document details the security model, invariants, and threat analysis for Firestore database access.

## 1. Data Invariants
- **User Config**: A user config (`/userConfigs/{userId}`) must be owned by the user matching the document key (`userId == request.auth.uid`). A user can only access and update their own configuration.
- **Activity Logs**: Activity logs (`/userConfigs/{userId}/logs/{logId}`) are nested under the parent User Config. Read and write access is strictly isolated to the parent user owner (`request.auth.uid == userId`).
- **Encryption Integrity**: Users must never be able to store raw tokens without encryption on the server database. All stored tokens are AES encrypted strings of variable block sizes.
- **Sanitization**: ID path parameters must be validated (`isValidId`). Timestamps must use `request.time`.

## 2. The "Dirty Dozen" Threat Payloads (Targeting Firestore)
These malicious payloads designed by an attacker must be mathematically rejected by our Firestore Security Rules.

1. **Attempting to read another user's Discord token:**
   `GET /userConfigs/attacker_id` impersonating `legit_user_id`. (Rejected: UID mismatch).
2. **Attempting to create userConfig with a spoofed userId:**
   `CREATE /userConfigs/legit_user_id` with `{ userId: 'other_user_id', ... }`. (Rejected: owner UID check).
3. **Ghost fields injection in User Config:**
   `UPDATE /userConfigs/user_id` with `{ isAdmin: true }` but `affectedKeys().hasOnly()` limits keys to editable fields. (Rejected: keys restriction).
4. **Junk String ID injection:**
   `CREATE /userConfigs/` with document ID `/userConfigs/a_very_long_poinsoning_id_1234_garbage...` (Rejected: ID size limit < 128).
5. **No authentication access:**
   `GET /userConfigs/user_id` unauthenticated. (Rejected: non-nullable `request.auth`).
6. **Spoofing Email verification:**
   `CREATE /userConfigs/user_id` with `request.auth.token.email_verified == false` (Rejected: requires verified email).
7. **Modifying Immortal Fields (`createdAt` or `userId`):**
   `UPDATE /userConfigs/user_id` with changed `createdAt`. (Rejected: immutable value mismatch).
8. **Forged Server Timestamps:**
   `CREATE /userConfigs/user_id` with raw client-supplied `createdAt` value. (Rejected: must equal `request.time`).
9. **Reading all system config records:**
   `LIST /userConfigs` (Rejected: Blanket list read denied without individual ID query).
10. **Writing to non-existent activity log subcollections:**
    `CREATE /userConfigs/user_id/logs/log_id` where parent userConfig does not exist. (Rejected: requires parent correlation via `exists`).
11. **Injecting invalid field types in Activity Log:**
    `CREATE /userConfigs/user_id/logs/log_id` with `{ actionType: 12345 }` (Rejected: must be string).
12. **Tampering with completed logs:**
    `UPDATE /userConfigs/user_id/logs/log_id` changing log content. (Rejected: logs are immutable once created).

## 3. Red Team Alignment Matrix
- **Identity Spoofing**: Blocked via `request.auth.uid == userId` and verified emails.
- **State Shortcutting / Key Modification**: Protected via `incoming().diff(existing()).affectedKeys().hasOnly(...)`.
- **Resource Poisoning**: Strict size checks on strings and IDs.
