# Badges

Kihon badges are compact, non-interactive labels for short state or category text. They are CSS-only; applications own the meaning and any behavior that changes the label.

## CSS entry point

Load `src/css/base.css`; it imports the badge component. Do not import `badges.css` separately when using the base entry point.

## Public classes

| Class | Purpose |
| --- | --- |
| `.kh-badge` | Compact pill-shaped label. Apply with one variant. |
| `.kh-badge--neutral` | Supporting information without a status color. |
| `.kh-badge--accent` | A highlighted category using the theme accent. |
| `.kh-badge--success` | Positive status text with an accessible green foreground/background pairing. |

```html
<span class="kh-badge kh-badge--success">Observed recently</span>
<span class="kh-badge kh-badge--neutral">Queued</span>
<span class="kh-badge kh-badge--accent">In progress</span>
```

Use short text to communicate the status without relying on color. A static badge does not need a live region. If an application updates status dynamically and users need to hear the change, announce it through an appropriate adjacent `role="status"` region. Badges are not buttons; give actions a native button or link instead.

The success variant uses `--kh-color-success` and `--kh-color-success-background`; the accent variant uses `--kh-color-accent` and `--kh-color-on-accent`. Both themes meet the text contrast requirement for the documented pairings. Forced-colours mode preserves a visible boundary and readable text.

## Reference screenshots

[Light theme](screenshots/badges-light.png) · [Dark theme](screenshots/badges-dark.png)
