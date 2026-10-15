# Case study: stop schedule conflicts at the point of change

**Scope:** single-page fictional operations planner, no backend or real users. **Status:** browser-local prototype; not live software.

## Problem

An operations screen can show bookings clearly but still allow a change that silently creates overlapping resource commitments. A stronger interface should communicate conflicts and validate a proposed action against the complete schedule, including rows currently hidden by filters.

## Demonstration

Open the static app via a local HTTP server (see root README). The initial fixture has **10 sessions** and **one overlapping room reservation**, affecting two rows. A user can move one booking to a free room, cancelling the conflict. Re-activating another booking that would share a room at overlapping times is rejected, retaining the previous state.

## Why this UI

- A compact table keeps related operational facts visible together. There is no permanent split-view inspector.
- A modal is sufficient because only two editable fields exist: room and status. Schedule-time changes would need a separate workflow.
- Conflict checks operate on the complete unfiltered session set; search/filter change presentation, not policy.
- Synthetic records are resettable so anyone can reproduce the starting failure and its resolution.

## Verification

```bash
npm test
python tests/browser_smoke.py  # optional, needs Playwright + installed Chromium
```

The optional smoke executes the **local source modules** inside a headless Chromium document and checks conflicting edits, error feedback, resolution, filtering, reset, no JS exceptions and page overflow at 320/390/768/1440 px. Module loading through an actual HTTP origin is **not** covered by that harness: browser navigation is blocked in the current test environment.

## Limits and falsifiers

There is no server persistence, API, authentication, concurrent editor support, audit history, timezone/recurrence model or broad accessibility testing. If two users submit simultaneous changes to a real booking store, this browser-only demo offers no correctness guarantee. A real implementation would need transaction-side checks and observable conflict resolution.

## What this evidence establishes

A deliberately constrained product workflow tied to executable business checks, not a complete scheduling platform. Authorship and suitability for public portfolio use must be reviewed by the owner.
