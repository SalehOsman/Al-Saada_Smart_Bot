# Implementation Plan: CI Fixes

**Goal**: Fix 5 CI test failures occurring in GitHub Actions while passing locally.

## Technical Strategy

- **FIX 1 (Validators)**: Verify and ensure `@al-saada/validators` resolves correctly in CI.
- **FIX 2 (Redis)**: Mock ioredis and maintenance service in core tests to avoid real Redis connections.
- **FIX 3 (CLI)**: Fix `scripts/tests/module-create.test.ts` to correctly handle `execSync` output on Linux.

## Tech Stack

- TypeScript, Node.js, Vitest, grammY.

## Architecture & Integration

- No new features, only surgical test fixes.
- Mocking Redis at the module level using `vi.mock`.
- Enhancing CLI tests for multi-platform compatibility.
