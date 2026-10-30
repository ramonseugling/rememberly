# Mobile development guide

The approved direction is a free iOS/Android application using React Native and Expo, with the existing features plus push notifications. The Next.js site, HTTP API, database, and user accounts remain shared.

This directory replaces the earlier Portuguese planning document. These are planning and working instructions, not an implemented mobile application.

## Read only what the task needs

| Need                                                    | Document                                                |
| ------------------------------------------------------- | ------------------------------------------------------- |
| Scope, milestones, store preparation                    | [Roadmap](roadmap.md)                                   |
| Boundaries, cloud workflow, notification design         | [Architecture](architecture.md)                         |
| Existing HTTP capabilities and proposed changes         | [API contracts](api-contracts.md)                       |
| Accepted choices and unresolved questions               | [Decisions](decisions.md)                               |
| Existing checks, historical blockers, automation policy | [Validation](validation.md)                             |
| Smallest next delivery                                  | [Contract sequence and next API work](api-contracts.md) |
| Start another bounded task                              | [Task template](tasks/TEMPLATE.md)                      |

The [mobile session contract](session-contract.md) is implemented and locally verified. [MOB-002](tasks/MOB-002-session-api.md) records 111 passing integration tests and remaining release requirements. The Expo application has not been created.

## Working loop

1. Select one task with a concrete outcome and inspect its source files.
2. Resolve only decisions required by that task; record durable choices once.
3. Implement and run the smallest meaningful checks, then broaden if necessary.
4. Review the diff and record actual outcomes, blockers, and the next action.

Start a new conversation for an independent task when useful. Supply the task path and branch/commit, rather than pasting the entire plan or previous chat. Instructions and files provide durable context; they do not replace reading actual code or checking current state.

## Skills and agents

Use the two `AGENTS.md` files for stable repository rules. Do not load every planning document into every task.

No new skills, subagents, or speculative automation are installed by this preparation. After a workflow is exercised, consider a small skill for API contract changes, mobile verification, or release preparation. A skill should link to authoritative project files and contain repeatable procedure, not copies of architecture or task history.

Use one primary agent by default. Additional agents are useful for an explicitly authorized independent review or separately owned work after contracts are agreed. Parallel agents reduce elapsed time in some cases, but can increase token usage and integration work.

## First useful milestone

An installed development build can sign in with an existing account, fetch protected data, reopen its session, and log out with server-side revocation. Complete the session contract before implementation; do not bootstrap the entire product in one task.
