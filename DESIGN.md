# Quizo visual system

This document is the source of truth for visual changes. It follows the `DESIGN.md` approach from the Awesome DESIGN.md collection, while keeping Quizo’s own orange identity.

## Direction

Quizo is a dark learning arena for students and facilitators. The dashboard should feel energetic, the question view focused, and the correction calm. Use broad typography and purposeful motion to guide attention without delaying an answer.

## Tokens

- Canvas: `#0d0e0c` with charcoal surfaces (`#1a1c18`, `#22241f`). Light mode uses `#f7f5f0` and warm white surfaces.
- Accent: warm orange (`#f97316`). Use it for primary actions, selection, and progress.
- Text: off-white for headings, muted warm gray for supporting copy.
- Semantic colors: emerald for correct/online, red for incorrect/offline. Never use them as decoration.
- Radius: 16px for panels, 12px for controls, full radius only for status indicators.
- Borders: 1px translucent warm gray. Avoid stacking borders on every row.
- Shadows: quiet and neutral on raised surfaces. Avoid glow on static cards and metrics.

## Typography

- Use the system sans stack already shipped by the app. Do not add a remote font request.
- Lead with medium or semibold headings; reserve very heavy weight for scores and live moments.
- Headings use tight tracking and `text-wrap: balance`.
- Body copy stays near 65 characters per line.
- Scores, timers, and rankings use tabular numerals.
- Labels use sentence case whenever possible; uppercase is reserved for small semantic metadata.

## Layout

- The page frame uses the available desktop width with fluid gutters; only reading text gets a narrower measure.
- On the dashboard, show recent quizzes and their next action in the first viewport. Keep the heading compact and place aggregate counts after the work list.
- Use web glass as a restrained material for the floating navigation and one action rail. Quiz rows and reading surfaces stay matte; provide a solid fallback when transparency is reduced or unavailable.
- Desktop live and quiz views give the question a broad main arena and use a compact context rail when needed.
- Tablet views collapse to two columns; mobile is one column with a safe-area-aware action dock.
- Answers are always a compact 2×2 grid on desktop and a single stack on narrow screens.
- Keep the question readable before showing secondary analytics.
- Do not introduce nested cards merely to group content. Use spacing and dividers first. The home dashboard uses rows for recent quizzes and a separate action rail.

## Motion

- Heroes, question changes, answers, and results may use large but short entrance transitions. Never keep the user waiting for motion to finish before they can answer.
- Animate `transform` and `opacity`, never layout dimensions.
- Every animation communicates progress, correctness, score, rank, or a transition.
- Use spring entrances for sections and cards, stagger related items by 50–80 ms, and keep hover feedback brief. The home quiz preview may respond to a mouse pointer; touch interaction stays still.
- Respect `prefers-reduced-motion`, avoid decorative continuous loops, and keep a local mute control for game sounds.

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
