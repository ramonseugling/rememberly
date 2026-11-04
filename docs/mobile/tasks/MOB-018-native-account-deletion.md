# MOB-018: Native account deletion

Status: implemented and locally verified; device/release validation pending.

## Outcome

Profile exposes DeleteAccount with password, exact DELETE text, native destructive confirmation, stale-account/unmount guards, safe403 feedback, owned-group409 guidance, and local logout after successful deletion. The accepted rule requires owners to delete their groups first.

## Verification

Four pure confirmation tests and the combined 71-case mobile run pass. Backend native/web deletion, rollback, and races are included in the 48-suite/405-test root selection. Native Alert and keychain interactions still need device validation.

## Limits

Password-only reauthentication is supported for this MVP; provider reauthentication for future Google/Apple accounts and final privacy/store disclosures remain release work.

No production operation, commit, external send, or signed build was performed by this task. See [push contract](../push-contract.md), [account deletion](../account-deletion.md), and [validation](../validation.md) for the relevant evidence.
