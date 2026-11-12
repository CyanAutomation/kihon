# Motion contract

Motion communicates a state change, relationship, or response. It is optional; it is never required to understand content or complete an action.

| Event | Motion purpose | Reduced-motion alternative |
| --- | --- | --- |
| Navigation | Briefly show a parent/detail relationship when a view is replaced | Render the destination immediately; preserve focus and history |
| Modal or sheet | Show that a task is entering or leaving the current context | Change visibility without sliding, scaling, or parallax |
| Selection | Confirm which item now controls the detail pane | Update selected and current state immediately |
| Save/update | Acknowledge completion or pending work | Keep a text/status message and progress state |
| Loading | Communicate that work is pending when the wait is meaningful | Use a static progress indicator and status text |

## Rules

- Prefer short opacity or position changes only when spatial continuity helps; do not delay input until a decorative transition completes.
- Preserve layout stability. Animate an element's own state rather than shifting unrelated content.
- Avoid large parallax, auto-playing motion, repeated pulses, and decorative entrance choreography.
- Provide text and semantic state alongside a spinner or color change.
- Prefer CSS transitions over a JavaScript animation system for a small visual state change.
- Respect prefers-reduced-motion: reduce. Remove nonessential movement; do not remove state feedback.
- Use a no-animation default if the media query is unavailable or the effect is not supported.
- Do not rely on view-transition APIs until feature detection, cross-route behavior, focus handling, and fallback have been validated.

## Acceptance checks

- With reduced motion enabled before page load, navigation and presentation remain understandable and usable.
- Toggling reduced motion while the app is open does not leave a view half-transitioned.
- Motion does not hide focus, block input, or carry meaning that is absent from the final state.
- If animation fails or is disabled, the same content and action remain available.
