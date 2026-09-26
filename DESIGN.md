# Quizo visual system

This document is the source of truth for visual changes. It follows the `DESIGN.md` approach from the Awesome DESIGN.md collection, while keeping Quizo’s own orange identity.

## Direction

Quizo is a dark, focused learning arena for students and facilitators. The interface should feel energetic during a live round and calm during review. Prefer clear hierarchy over decoration, and reserve animation for feedback, progress, and state changes.

## Tokens

- Canvas: `#070707` with charcoal surfaces (`#141414`, `#1b1b1b`).
- Accent: warm orange (`#f97316`) with amber highlights (`#fbbf24`). Use one accent family per view.
- Text: off-white for headings, muted warm gray for supporting copy.
- Semantic colors: emerald for correct/online, red for incorrect/offline. Never use them as decoration.
- Radius: 16px for panels, 12px for controls, full radius only for status indicators.
- Borders: 1px translucent warm gray. Avoid stacking borders on every row.
- Shadows: tinted toward orange only on active or primary surfaces.

## Typography

- Use the system sans stack already shipped by the app. Do not add a remote font request.
- Headings use tight tracking and `text-wrap: balance`.
- Body copy stays near 65 characters per line.
- Scores, timers, and rankings use tabular numerals.
- Labels use sentence case whenever possible; uppercase is reserved for small semantic metadata.

## Layout

- Desktop live views use a 12-column grid with a generous main arena and a compact context rail.
- Tablet views collapse to two columns; mobile is one column with a fixed action dock.
- Answers are always a compact 2×2 grid on desktop and a single stack on narrow screens.
- Keep the question readable before showing secondary analytics.
- Do not introduce nested cards merely to group content. Use spacing and dividers first.

## Motion

- Motion intensity is standard for product surfaces and intense only for competition feedback.
- Animate `transform` and `opacity`, never layout dimensions.
- Every animation communicates progress, correctness, score, rank, or a transition.
- Respect `prefers-reduced-motion` and keep a local mute control for game sounds.

## Interaction and accessibility

- Every icon-only action has an accessible label and a visible focus ring.
- Buttons are used for actions, links for navigation.
- Error, loading, and empty states are explicit and actionable.
- Touch targets remain comfortable on mobile and preserve keyboard shortcuts A–D in the arena.
- Do not reveal other players’ answers before the host reveals the round.

## Content rules

- Use active, specific French copy.
- Avoid hype language, fake statistics, and unexplained abbreviations.
- Preserve existing routes, form names, analytics events, and the Quizo wordmark.
