# Security Specification - Eternal Path

## Data Invariants
1. A grave must belong to an existing cemetery (verified via `cemeteryId`).
2. A grave must have a `photoUrl` and `fullName`.
3. Only authenticated staff can create or update cemetery/grave records.
4. Public users can only read records.

## The "Dirty Dozen" Payloads

1. **Spoof Owner (Identity Spoofing)**: Creating a grave with a `createdBy` field that doesn't match the authenticated user.
2. **Resource Poisoning**: Document IDs with 1MB of junk characters.
3. **State Shortcutting**: Updating `createdAt` on an existing record.
4. **Invalid Parent**: Creating a grave with a `cemeteryId` that doesn't exist.
5. **Orphaned Write**: Creating a grave without a `cemeteryId`.
6. **Field Injection**: Adding a `isVerified: true` field to a grave record that isn't in the schema.
7. **Type Poisoning**: Sending `location: "somewhere"` (string) instead of a Map.
8. **Size Attack**: Sending a `fullName` that is 1MB long.
9. **Timestamp Spoofing**: Sending a `createdAt` from the future.
10. **Unauthorized Delete**: Anonymous user trying to delete a cemetery.
11. **Malicious Update**: User trying to change the `cemeteryId` of a grave they didn't create.
12. **PII Leak**: Querying for `createdBy` email fields if they were meant to be private (though here they are primarily for audit).

## Test Runner (Draft Plan)
- Verify `allow read: if true`.
- Verify `allow write: if isSignedIn() && isVerified()`.
- Check schema validation via `isValidGrave()`.
