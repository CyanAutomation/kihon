# Touch, pointer, and keyboard interaction

Web interactions should work through the input the person has available. A touch-first layout can be generous and direct without breaking browser selection, scrolling, pinch zoom, pointer behavior, or keyboard access.

## Touch and pointer

- Keep frequent touch controls at least 44 by 44 CSS px as Kihon's existing recommendation. The current standard button height is 48 px. Leave enough separation to prevent adjacent accidental activation.
- Provide immediate visual pressed feedback for buttons and selection changes. Do not depend on hover. Do not delay feedback behind a network response.
- Keep native scroll behavior for content. Use overscroll containment only on a region that intentionally owns a nested scroll, and never to trap the entire page unexpectedly.
- Keep links as links and actions as buttons. Pointer activation, touch activation, and keyboard activation must lead to the same result.
- Use a pointer affordance only where it helps; never require hover to reveal an essential action.
- Drag and drop is optional enhancement. Provide a button or keyboard-operable alternative for the same task.

## Gestures

Use platform/browser gestures only as optional shortcuts to a visible action. Never make edge swipe, long press, drag, or a custom swipe the only way to go back, delete, select, or reveal a control. Do not call preventDefault on system/browser gestures without an essential, tested product requirement.

For a custom gesture, specify the start area, threshold, cancellation, conflict with scrolling, state feedback, and an equivalent visible control. Test at slow speed and with assistive input. If it conflicts with page scroll or browser navigation, remove it.

## Keyboard and focus

- Native buttons, links, inputs, select elements, and dialogs retain their standard key behavior.
- Tab order follows visual task order. Do not add positive tabindex. Use a roving tabindex or arrow-key model only for a documented composite widget and test its full keyboard pattern.
- Every control has a visible focus indicator that is not clipped by overflow.
- When a selected row opens a detail region, keep selection semantically exposed and provide a normal link or action that can be activated from the keyboard.
- Do not bind shortcuts to browser or OS-reserved keys. Show any application shortcut in the relevant menu or label; it is never the sole route to the action.

## State feedback

Selection must be conveyed with more than color alone: use semantics, text, shape, or a checkmark together with contrast. A pending action should expose progress without changing its accessible name. Errors explain what failed and what can be done. Success feedback remains available long enough to perceive and is not announced repeatedly.

## Acceptance checks

- A person can complete the same core workflow using touch, mouse/trackpad, keyboard, and assistive technology.
- At 200% text size and 400% browser zoom, labels wrap and controls remain reachable without page-level horizontal scrolling for ordinary content.
- A user who cannot perform a swipe or drag has an obvious equivalent control.
- Scrolling is not hijacked by an app-level gesture. Native zoom and browser navigation continue to work.
