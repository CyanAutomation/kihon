# Presentation contract

Dialogs, sheets, popovers, menus, and inline disclosure solve different tasks. Choose by user intent and spatial context, not by whichever shape is easiest to style.

| Pattern | Use it for | Do not use it for |
| --- | --- | --- |
| Modal dialog | A focused task or decision that must pause the current context; Kihon's existing native dialog is the current reusable API | Routine information, a full page of navigation, or a choice list that can stay in context |
| Sheet | A scoped, related workflow that benefits from a temporary layer and a clear Done/Cancel result, especially on a compact screen | A menu of quick commands, an error toast, or a task that needs several levels of navigation |
| Popover | A small contextual control or explanatory panel anchored to a visible trigger when there is room | A required mobile interaction that would be cramped or partially obscured |
| Confirmation interface | A consequential or destructive choice where the person must understand what will happen and choose a specific next action | A routine save or other reversible, low-risk step |
| Contextual action menu | A small set of commands tied to a specific selected object, available through a labeled button and optionally pointer context action | The sole way to discover important actions or the only route to a destination |
| Inline expansion | Short supplementary detail that benefits from reading in place | A multi-step editor, long form, or content that needs its own URL and focus context |

These names describe interaction intent. A browser may not implement a native sheet or context menu for custom web content. Use semantic markup and a tested web presentation; do not claim it is an operating-system sheet.

## Opening and closing

- Keep a visible, labeled trigger. Place the presented content near the source when it is contextual.
- For a modal, use Kihon's native dialog pattern where it fits. Give it an accessible name and intentional initial focus; keep focus within a truly modal surface and restore focus to its trigger on close.
- Provide a visible Cancel or Close action. Escape may dismiss a non-destructive, cancellable presentation. Do not require backdrop clicking.
- Ask before dismissing meaningful unsaved work. Explain the consequence and provide a way to stay.
- On close, restore the context and selection that opened the surface.
- Avoid stacking modal surfaces. If the task needs a second decision, replace or sequence the first surface with clear focus transfer.

## Viewport and input constraints

- On compact viewports, make task surfaces fit available height and remain scrollable. Keep the heading, close/cancel control, active input, and primary action reachable when the virtual keyboard appears.
- Do not force the document into a fixed-height, no-scroll panel unless the full-screen workflow has been validated on devices.
- A popover must stay within the visible viewport and not be the only way to reach its controls. On narrow layouts, switch to an inline region or a full-width modal surface with equivalent content and semantics.
- Menus must open from an explicit button; support keyboard activation, focus, Escape dismissal, and a visible selection/disabled state. Do not assign role="menu" to a simple set of ordinary links unless implementing the corresponding menu keyboard model.
- Native confirmation dialogs may be appropriate for a narrowly scoped destructive decision, but domain-specific details and undo/recovery may require a custom labeled dialog.

## Accessibility acceptance

- The trigger's accessible name tells people what opens.
- The presented surface has an accessible heading, sensible reading order, and a visible close or cancel control.
- Keyboard users can open it, reach its controls, leave or dismiss as documented, and return to the trigger.
- Focus is not lost behind a modal surface. Nonmodal popovers do not unexpectedly trap focus.
- Screen readers hear the opening state and any validation/error feedback.
- At zoom and with the software keyboard, essential controls remain visible or can be reached by scrolling.
