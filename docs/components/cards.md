# Cards

Kihon cards provide a reusable surface for related content and actions. They are CSS-only and leave semantics, content, and behavior to the consuming application.

## CSS entry point

Load `src/css/base.css`; it imports the card component. Do not import `cards.css` separately when using the base entry point.

## Public classes

| Class | Purpose |
| --- | --- |
| `.kh-card` | Surface, border, radius, and spacing for a related content group. |
| `.kh-card__header` | Title, description, and optional metadata. |
| `.kh-card__title` | A heading styled for the card; use the correct HTML heading level. |
| `.kh-card__description` | Supporting text for the card. |
| `.kh-card__body` | Main card content. |
| `.kh-card__footer` | Wrapping row for related actions or metadata. |

```html
<article class="kh-card" aria-labelledby="device-title">
  <header class="kh-card__header">
    <h2 class="kh-card__title" id="device-title">Bedroom left</h2>
    <p class="kh-card__description">Window covering controls and recent activity.</p>
  </header>
  <div class="kh-card__body">
    <p>Current position: <strong>Open</strong></p>
  </div>
  <footer class="kh-card__footer">
    <button class="kh-button kh-button--primary" type="button">Open</button>
    <button class="kh-button kh-button--secondary" type="button">Details</button>
  </footer>
</article>
```

Choose `article`, `section`, or `div` according to the content structure. The class does not add a role, heading, focusability, or interaction. Do not make the whole card clickable when it contains independent actions; use a descriptive link or button for each action.

Cards use semantic surface, text, border, spacing, and radius tokens. In forced-colours mode the component exposes a system-colour boundary. It adds no shadow or motion, so content remains clear under high contrast and reduced-motion settings.

## Reference screenshots

[Light theme](screenshots/cards-light.png) · [Dark theme](screenshots/cards-dark.png)
