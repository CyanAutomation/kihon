# Kihon Testing

This directory contains test fixtures, checklists, and validation procedures for Kihon Phase 1.

## Automated Checks

```bash
npm run test
```

Runs:
1. **build** — Generate CSS from design tokens
2. **validate** — Check token source and CSS correctness
3. **sanity** — Verify HTML, CSS and token structure

All three must pass before committing changes.

## Manual Testing

See [MANUAL_TESTING.md](MANUAL_TESTING.md) for a comprehensive checklist covering:

- Keyboard navigation
- Screen reader testing
- Text resize and zoom
- Colour contrast verification
- Reduced motion and forced colours
- Touch and pointer interaction
- Responsive layout
- Form usability
- Component states
- Browser compatibility

Print and complete this checklist before a release.

## Accessibility Requirements

Kihon targets **WCAG 2.2 AA** conformance for applicable user interfaces.

### Colour Contrast (WCAG 2.2 Success Criterion 1.4.3)

| Element Type | Requirement | Example |
| --- | --- | --- |
| Normal text | 4.5:1 | Body text, labels |
| Large text (18px+ or 14px+ bold) | 3:1 | Headings |
| Graphical objects | 3:1 | Icons, borders |
| UI components | 3:1 | Button borders, focus rings |

**Note:** Test actual **combinations** (foreground on background), not isolated colours.

Critical pairs for Kihon:

- `--kh-color-text-primary` on `--kh-color-background`
- `--kh-color-text-primary` on `--kh-color-surface`
- `--kh-color-text-secondary` on `--kh-color-surface`
- `--kh-color-on-accent` on `--kh-color-accent`
- `--kh-color-focus-ring` on `--kh-color-background`

### Keyboard Access

Every interactive element must be operable via keyboard:

- Tab: move focus forward
- Shift+Tab: move focus backward
- Enter: activate buttons and submit forms
- Space: toggle checkboxes and radio buttons
- Escape: close modals (when implemented)
- Arrow keys: navigate within composite widgets (when applicable)

### Focus Management

- Focus must always be visible (no `outline: none` without replacement)
- Focus must never be trapped
- Focus order must follow logical reading order
- Focus indicators must not be obscured by content or other elements

### Reduced Motion

Respect `prefers-reduced-motion: reduce`:

- Disable or minimize animations and transitions
- Essential information must not be conveyed solely through motion
- Animations should not flash or flicker (> 3 times per second)

### Forced Colours Mode

In forced-colours environments (high contrast, Windows High Contrast Mode):

- All text remains readable
- UI boundaries and controls remain identifiable
- Colours cannot be relied on to convey information
- Borders and outlines remain visible

---

## Browser Testing Matrix

Test on **current stable + 1 previous version**:

| Browser | Minimum Version | Status |
| --- | --- | --- |
| Safari (macOS) | Current-1 | ☐ Tested |
| Safari (iOS) | Current-1 | ☐ Tested |
| Chrome | Current-1 | ☐ Tested |
| Firefox | Current-1 | ☐ Tested |
| Edge | Current-1 | ☐ Tested |

---

## Viewport Testing

Test these widths to ensure responsive behaviour:

- **Narrow (320px)** — Mobile phone
- **Medium (768px)** — Tablet
- **Wide (1280px)** — Desktop
- **Extra-wide (1920px)** — Large monitor

At each breakpoint, verify:
- No horizontal scrolling for essential content
- Text is readable without zooming
- Interactive elements are appropriately sized
- Layout reflows gracefully

---

## Component Validation

Components are tested in these states:

### Buttons
- [ ] Default (rest)
- [ ] Hover
- [ ] Active (pressed)
- [ ] Focus-visible
- [ ] Disabled
- [ ] Loading/busy

### Form Inputs
- [ ] Empty
- [ ] Filled
- [ ] Focus
- [ ] Error
- [ ] Disabled
- [ ] Read-only

### Checkboxes / Radio Buttons
- [ ] Unchecked
- [ ] Checked
- [ ] Focus
- [ ] Disabled (unchecked)
- [ ] Disabled (checked)
- [ ] Required

### Colour Swatches
- [ ] Light theme
- [ ] Dark theme
- [ ] Sufficient contrast
- [ ] Accessible name

---

## Known Limitations

- Phase 1 does not include component library (buttons, forms, dialogs as base styles only)
- Phase 1 does not include desktop sidebar or toolbar patterns
- Colour contrast validation is semi-automated; manual checks are required
- Screen reader testing is limited to smoke tests; full WCAG testing requires professional audit

---

## Continuous Integration

The CI pipeline should:

1. ✓ Install dependencies
2. ✓ Run `npm run build`
3. ✓ Run `npm run validate`
4. ✓ Run `npm run sanity`
5. ✓ Verify `src/css/tokens.css` is not stale
6. ⚠ (Optional) Run visual regression tests
7. ⚠ (Optional) Run accessibility audit

Fail the build if any required step fails.

---

**Last updated:** 2026-11-06  
**Kihon version:** 1.0.0-draft.1  
**Specification:** Draft 0.1
