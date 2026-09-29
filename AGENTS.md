# Behold Engineering and Design Guide

## Project Context

- Behold is an Expo SDK 57 music learning and hymn practice app.
- Read the exact Expo SDK 57 documentation at https://docs.expo.dev/versions/v57.0.0/ before changing Expo APIs, native configuration, or platform behavior.
- Prefer the existing components, theme helpers, hooks, and services under `src/` over introducing parallel abstractions.
- Keep changes focused. Do not rewrite unrelated screens, migrate libraries, or change public behavior without a clear requirement.

## Product Experience

- Design for repeated practice sessions: the current song, current measure, current note, tempo, and playback state should always be easy to understand.
- Prioritize rapid scanning and low-friction actions over decorative content.
- Preserve context when moving between songs, measures, playback, practice, and results.
- Give every async, empty, paused, error, and completed state a deliberate UI treatment.
- Music notation is primary content. Never let controls, overlays, labels, or animations obscure staff lines or active notes.

## Layout and Responsive Design

- Support phone portrait, phone landscape, tablet, and web widths without relying on a single fixed viewport.
- Use safe-area insets for content that touches device edges.
- Use stable dimensions for staff measures, playback cursors, buttons, chips, and touch targets so playback cannot cause layout shifts.
- Keep interactive targets at least 44 by 44 points where practical.
- Prefer clear spacing, alignment, and hierarchy over nested cards or excessive borders.
- Avoid placing a card inside another card. Use full-width sections for page structure and cards only for genuinely grouped or repeated items.
- Ensure text wraps or truncates intentionally and never overlaps adjacent controls.

## Visual System

Use the existing theme tokens and keep the visual language consistent across all screens.

- Yellow is the action and music-state accent: `#FFD700`, `#FACC15`, and `#EAB308`.
- Black is used for deep backgrounds, notation ink, and text on yellow surfaces: `#000000`, `#121212`, `#151718`.
- Gray is used for surfaces, borders, inactive controls, and secondary text: `#1E293B`, `#2C2C2C`, `#334155`, `#475569`, `#64748B`, `#94A3B8`, and `#FFFFFF`.
- Text or icons on solid yellow must be black.
- Do not introduce rogue blue, teal, cyan, purple, or unrelated accent colors. Add a new color only when it communicates a necessary semantic state and document why.
- Reuse `src/theme/platformDesign.ts` and `constants/theme.ts` tokens instead of scattering new values.
- Prefer expressive but legible typography with clear size, weight, and contrast hierarchy. Do not use oversized marketing-style headings inside operational music screens.

## Components and Interaction

- Use existing adaptive components such as `AdaptiveButton`, `AdaptiveCard`, `AdaptiveChip`, and `AdaptiveHeader` when they fit the job.
- Use icons for familiar actions and pair unfamiliar icons with accessible labels or tooltips.
- Use segmented controls for modes, chips for compact selections, toggles for binary settings, and sliders or steppers for numeric values.
- Buttons must visibly communicate pressed, disabled, selected, and loading states.
- Use haptics only for meaningful actions such as selection, playback changes, or completed practice events.
- Animations should clarify state and direction. Playback movement must be continuous and time-based rather than snapping at measure boundaries.
- Keep animations interruptible when possible and avoid motion that competes with notation or creates visual noise.

## Accessibility and Platform Behavior

- Provide accessible labels and hints for icon-only controls.
- Maintain readable contrast for every state, including disabled and selected states.
- Do not rely on color alone to communicate note evaluation, playback, or errors.
- Respect reduced-motion preferences when adding nonessential animation.
- Use platform-specific behavior only when it improves the platform experience; keep Android, iOS, and web behavior functionally consistent.
- Use `boxShadow` for shadows. Do not add deprecated `shadowColor`, `shadowOffset`, `shadowOpacity`, or `shadowRadius` style props.

## Implementation and Validation

- Use TypeScript and preserve existing public interfaces unless the requirement needs a contract change.
- Keep music timing and notation calculations in services or utilities, not inside render-only code.
- Before editing, identify the component or service that directly controls the behavior.
- After editing, run the narrowest relevant check first, then run `npx tsc --noEmit` or `npm run lint` when applicable.
- For visual changes, verify at least one narrow phone layout and one wider layout. Check that long titles, empty states, playback controls, and modal content do not overlap.
- Do not commit generated files, secrets, credentials, or unrelated formatter churn.
