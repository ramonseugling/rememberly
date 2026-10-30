# MOB-001: Specify the mobile session contract

Status: ready

## Outcome

Define a reviewable, implementable HTTP contract that lets a native app obtain a session, read its authenticated user, and revoke that session while preserving existing web login behavior.

## Context and dependencies

- Read [API inventory](../api-contracts.md) and the authentication section of [Architecture](../architecture.md).
- Inspect `pages/api/v1/sessions/index.ts`, `infra/controller.ts`, `models/session.ts`, relevant schemas/errors, and existing session integration tests.
- No Expo project, store account, OAuth provider setup, or outbound email is required for this specification task.

## Scope

- Choose additive routes or explicit mobile mode, and document the compatibility rationale.
- Specify methods, validated input, credential issuance/transport, response/status shapes, expiration, user fields, and logout/revocation.
- Specify absent, invalid, expired, and revoked credentials; establish behavior for competing cookie/Bearer credentials.
- Document secure client persistence and redaction; preserve cookie-based web clients.
- Update the canonical API document and add a concise decision entry. Identify the next implementation task using the template.

## Outside this task

- Implementing API handlers, migrations, refresh-token rotation, OAuth, mobile screens, or a new shared package.
- Refactoring all authentication or fixing unrelated baseline checks.

## Acceptance criteria

- [ ] Complete request/response examples use fictitious values and agree with the existing session model or explicitly justify changes.
- [ ] Web compatibility and cookie/Bearer precedence are explicit.
- [ ] Security, expiry, revocation, and failure semantics are testable.
- [ ] Follow-up implementation has bounded scope and a concrete integration-test matrix.

## Verification

Cross-check the specification against actual handlers/models/tests. Format touched Markdown and validate relative links. No application build is required for this documentation-only task.

## Completion record

- Result: not started; task definition prepared.
- Checks: none for contract behavior; no contract has been implemented.
- Blockers: none identified for specification work.
- Next action: inspect the session implementation and write the proposed contract.
