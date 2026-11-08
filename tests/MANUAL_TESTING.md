# Kihon Manual Testing Checklist

## Overview

This document provides a repeatable checklist for manual verification of Kihon's accessibility, usability, and visual correctness.

Run through these checks before finalizing a release or major update.

---

## Browser Matrix

Test on **current and immediately preceding stable versions**:

- [ ] Safari (macOS)
- [ ] Safari (iOS)
- [ ] Chrome/Chromium (macOS/Windows/Linux)
- [ ] Firefox (macOS/Windows/Linux)
- [ ] Edge (Windows)

---

## Keyboard Navigation

### Test with Tab, Shift+Tab, Enter, Space, Escape

On the style guide (`style-guide/index.html`):

- [ ] Tab moves focus forward through all interactive elements (links, buttons, inputs)
- [ ] Shift+Tab moves focus backward
- [ ] Focus is always visible (clearly visible indicator)
- [ ] Focus order follows a logical reading sequence
- [ ] No elements are skipped
- [ ] Skip link works (Shift+Alt+S or browser-specific)
- [ ] No keyboard traps (focus doesn't get stuck)
- [ ] Enter activates buttons and follows links
- [ ] Space toggles checkboxes and radio buttons
- [ ] Escape does not close content unexpectedly
- [ ] Form inputs accept keyboard input without issue

### Native Modal Dialogs

In the style guide's **Dialogs** section, verify each example with keyboard-only interaction:

- [ ] Open each dialog from its labeled trigger.
- [ ] Confirm focus starts on Close for information, the application-name field for preferences, and Cancel for destructive confirmation.
- [ ] Tab and Shift+Tab remain within the active modal and background controls cannot receive focus.
- [ ] Escape dismisses each standard dismissible example and does not run the destructive confirmation.
- [ ] Visible Close and Cancel actions work and focus returns to the invoking trigger.
- [ ] Remove the invoking trigger while the dialog is open and confirm the configured logical fallback receives focus.
- [ ] Submit invalid preferences, hear the error summary, and confirm the invalid field's help and error text are announced.
- [ ] Correct the preferences error and complete the local example; verify it closes only after valid submission.
- [ ] Confirm the destructive action is not initially focused and that Cancel leaves the status clear that nothing was deleted.
- [ ] Confirm the destructive action produces one local status update and deletes no real data.
- [ ] Test programmatic close and `returnValue` handling in a consuming application.

---

## Screen Reader Testing

Test with **one desktop screen reader** (e.g., NVDA, JAWS, VoiceOver):

- [ ] VoiceOver on macOS with Safari: open, explore, cancel, and close each dialog; verify its name, description, initial focus, and restoration.
- [ ] NVDA with a supported Windows browser, where available: verify modal announcement, focus containment, Escape, validation errors, and return focus.
- [ ] Check that preference validation errors are announced and remain associated with the invalid field.

### Heading Structure
- [ ] All headings are announced as headings with correct level (h1, h2, h3, etc.)
- [ ] No levels are skipped (e.g., h1 → h3 is incorrect)
- [ ] Heading text is descriptive and understandable out of context

### Form Controls
- [ ] Every input has a label
- [ ] Label text is clearly associated with the input
- [ ] Input type is announced (text, email, checkbox, etc.)
- [ ] Required fields are announced
- [ ] Error messages are announced when present
- [ ] Helper text and descriptions are read
- [ ] Settings titles announce the associated native controls and descriptions
- [ ] Error summary links move to the relevant fields

### Links and Buttons
- [ ] Links are announced as links with descriptive text
- [ ] Buttons are announced as buttons
- [ ] Icon-only buttons have accessible names
- [ ] Context is clear without relying on colour alone

### Lists and Landmarks
- [ ] Unordered and ordered lists are announced
- [ ] List items are counted
- [ ] Navigation landmark is present and labeled
- [ ] Main content landmark is present
- [ ] No unlabeled landmark sections

### Colour and Meaning
- [ ] Content is understandable without relying on colour
- [ ] Status and error states are conveyed with text, not colour alone
- [ ] Sufficient contrast is announced or visible

---

## Visual and Text Rendering

### Text Resize and Zoom
- [ ] Text can be resized up to 200% in browser settings
- [ ] All content remains readable and accessible at 200% resize
- [ ] No text is clipped, truncated or hidden
- [ ] Layout reflows appropriately
- [ ] Dialogs remain usable with 200% text resizing and long content; headings and actions remain reachable while the body scrolls.

### Page Zoom
- [ ] Page can be zoomed to 400% (Ctrl/Cmd + Plus)
- [ ] All content is still accessible at 400% zoom
- [ ] Horizontal scrolling is acceptable, but no functional loss
- [ ] Rounded corners and borders remain visible
- [ ] At 400% browser zoom, open and complete each dialog without clipped content or unreachable actions.

### Font Rendering
- [ ] System font stack renders correctly on each OS
- [ ] Font weight is clearly distinguishable (regular vs. bold)
- [ ] Line height is comfortable for reading body text
- [ ] Code blocks use monospace font
- [ ] Text is not cut off due to descenders or accents

---

## Colour and Contrast

### Manual Verification
- [ ] Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or similar
- [ ] Test critical foreground/background pairs:
  - [ ] Text primary on background: **4.5:1 minimum**
  - [ ] Text primary on surface: **4.5:1 minimum**
  - [ ] Text secondary on surface: **3:1 minimum** (large text)
  - [ ] Text on accent: **4.5:1 minimum**

### Light Theme
- [ ] All text is readable on light backgrounds
- [ ] Sufficient contrast between interactive and non-interactive elements
- [ ] Borders and focus rings are visible

### Dark Theme
- [ ] All text is readable on dark backgrounds
- [ ] No harsh eye strain or glare
- [ ] Sufficient contrast between interactive and non-interactive elements
- [ ] Borders and focus rings are visible

### Theme Switching
- [ ] Light theme toggle works and updates immediately
- [ ] Dark theme toggle works and updates immediately
- [ ] System theme toggle respects OS preference
- [ ] Theme preference persists on page reload (localStorage)
- [ ] No flash or layout shift during theme switch

---

## Reduced Motion

### Enable reduced motion in OS settings
(macOS: System Preferences → Accessibility → Display → Reduce motion; Windows: Settings → Ease of Access → Display → Show animations)

- [ ] All animations and transitions are minimal or disabled
- [ ] Content is still accessible and understandable
- [ ] No essential information is conveyed only by animation
- [ ] Page loads and functions without motion
- [ ] Dialog opening, closing, validation, and focus remain clear with reduced motion enabled.

---

## Forced Colours Mode

### Enable forced/high-contrast mode
(Windows: Settings → Ease of Access → Display → High contrast; macOS: System Preferences → Accessibility → Display → Increase contrast)

- [ ] All text remains readable
- [ ] Buttons and controls are still identifiable
- [ ] Focus indicators remain visible
- [ ] No information is lost
- [ ] Borders and boundaries are clear
- [ ] Dialog boundaries and keyboard focus remain visible in forced-colours mode.

---

## Touch and Pointer

### Mobile/Touch Device Testing (iPhone, iPad, Android)

- [ ] All buttons and controls are at least 44 × 44 CSS px
- [ ] Touch targets do not overlap
- [ ] Form inputs are usable on touch keyboards
- [ ] At a 320 CSS px viewport, dialog fields and actions remain reachable and labels may wrap.
- [ ] Open and dismiss dialogs using touch on a mobile viewport or device.
- [ ] Hover states are not required for functionality
- [ ] No:hover-only affordances
- [ ] Zoom is not disabled (no `user-scalable=no`)

### Mouse/Pointer Testing
- [ ] Hover states are clear and helpful
- [ ] Cursor changes appropriately (pointer on buttons/links)
- [ ] Click targets match visual boundaries
- [ ] Double-click is not required for any action

---

## Responsive Layout

### Narrow Viewport (320 CSS px)
- [ ] Content reflows gracefully
- [ ] No horizontal scrolling for essential content
- [ ] Text is readable without zooming
- [ ] Form inputs are full-width and easy to tap
- [ ] Navigation is accessible (not hidden without indication)

### Medium Viewport (768 CSS px)
- [ ] Layout adapts appropriately
- [ ] Two-column layouts switch to single-column if needed
- [ ] Tables or grids reflow properly

### Wide Viewport (1200+ CSS px)
- [ ] Multi-column layouts display correctly
- [ ] Content width is bounded (not stretching infinitely)
- [ ] Sidebar and main content are side-by-side if applicable
- [ ] No excessive line lengths (90 characters is reasonable)

### Application Shell
- [ ] At 320 and 480 CSS px, navigation, main content, and details stack in document order and remain visible.
- [ ] At 768 CSS px, confirm no shell region is compressed or hidden.
- [ ] At 1024 and 1280 CSS px, verify each present region has usable width and no empty column is reserved for an absent region.
- [ ] Navigate through header actions, nav links, main controls, and details links using Tab and Shift+Tab.
- [ ] Use the skip link and confirm focus reaches the main content without being obscured.
- [ ] Scroll long content and code, and confirm focused controls remain visible.
- [ ] Repeat with 200% text size and at 400% browser zoom where applicable.
- [ ] Check light and dark themes, forced colours, and reduced motion.
- [ ] On mobile browsers, check page scrolling with dynamic browser chrome and on-screen keyboards.

---

## Form Usability

### Input Fields
- [ ] Label is visible and persistent (not a placeholder)
- [ ] Placeholder text does not replace the label
- [ ] Focus state is clearly visible
- [ ] Error state is clearly marked (not just red)
- [ ] Error message explains how to recover
- [ ] Required/optional status is clear

### Browser Autofill
- [ ] Browser autofill works correctly (name, email, address, etc.)
- [ ] Autofilled values are readable
- [ ] No conflict with CSS styling

### Validation
- [ ] Native constraints prevent incomplete or malformed form submission
- [ ] Valid forms submit through the application's intended flow
- [ ] Error messages appear in context (near the field) after the chosen validation trigger
- [ ] Errors are not announced only via color
- [ ] Read-only fields remain focusable and copyable; disabled fields are unavailable
- [ ] Settings rows remain understandable and operable at narrow widths

---

## Component States

### Buttons
- [ ] Default state is clear
- [ ] Hover state is visually distinct (opacity or underline, not just colour)
- [ ] Active/pressed state is clear
- [ ] Focus state shows visible outline or ring
- [ ] Disabled state is clearly distinguished
- [ ] Busy/loading state does not trap focus

### Links
- [ ] Unvisited links are distinguishable
- [ ] Hover and active states are clear
- [ ] Focus state shows outline or highlight
- [ ] Links do not open in new tabs without warning (or use title attribute)

### Form Controls (Checkbox, Radio)
- [ ] Default (unchecked) state is clear
- [ ] Checked state is clearly visible
- [ ] Disabled state is clearly distinguished
- [ ] Focus state is visible
- [ ] Touch targets are at least 44 × 44 CSS px

### Inputs (Text, Email, etc.)
- [ ] Empty state is clear
- [ ] Filled state is clear
- [ ] Focus state shows visible indicator
- [ ] Error state is distinct from valid state
- [ ] Disabled state is clearly distinguished

---

## Data and Information

### Tables (if applicable)
- [ ] Headers are properly marked (`<th>` elements)
- [ ] Row and column relationships are clear
- [ ] Table has a descriptive caption or title
- [ ] Data is accessible to screen readers

### Lists
- [ ] Unordered lists use `<ul>`
- [ ] Ordered lists use `<ol>`
- [ ] Nested lists are properly nested
- [ ] List structure is preserved in speech

### Headings
- [ ] Heading hierarchy is logical and sequential
- [ ] No levels are skipped
- [ ] Headings accurately describe section content
- [ ] Heading text is substantial (not just decoration)

---

## Visual Design and Polish

### Typography
- [ ] Heading sizes have clear visual hierarchy
- [ ] Body text is comfortable to read (not too small, not too large)
- [ ] Line length is reasonable (not too wide)
- [ ] Line height is sufficient

### Spacing
- [ ] Elements are not crowded or cluttered
- [ ] Whitespace improves readability
- [ ] Consistent spacing between related items
- [ ] Padding and margins are appropriate

### Consistency
- [ ] Buttons look consistent throughout
- [ ] Form elements have consistent styling
- [ ] Colour use is consistent and intentional
- [ ] Typography follows the system

### Corners and Borders
- [ ] Border radius is restrained (not excessively rounded)
- [ ] Borders are visible and serve a purpose
- [ ] No borders cut off focus indicators

---

## Accessibility Compliance Checklist

- [ ] Valid HTML (no major structural errors)
- [ ] Valid CSS (no parsing errors)
- [ ] No JavaScript errors in console
- [ ] WCAG 2.2 AA colour contrast on critical pairs
- [ ] Focus management is appropriate
- [ ] Keyboard access for all interactive elements
- [ ] Semantic HTML used appropriately
- [ ] ARIA used only when necessary
- [ ] No unlabeled form fields
- [ ] No colour-only information

---

## Browser DevTools Verification

### Accessibility Panel
- [ ] Run Lighthouse accessibility audit (should score 85+)
- [ ] No critical or high-severity violations
- [ ] Review warnings and best practices

### Console
- [ ] No JavaScript errors
- [ ] No accessibility warnings from browser
- [ ] No deprecation warnings for CSS

### Elements Inspector
- [ ] Verify heading hierarchy
- [ ] Check for proper ARIA labels
- [ ] Inspect focus state styling
- [ ] Verify semantic HTML structure

---

## Performance and Loading

- [ ] Page loads within reasonable time (<3s on 4G)
- [ ] No layout shift during loading (CLS)
- [ ] CSS is applied before interactive elements render
- [ ] JavaScript does not block interactivity
- [ ] No inline styles conflicting with external CSS

---

## Documentation and Clarity

- [ ] Specification is clear and complete
- [ ] Development guide is accurate
- [ ] Build commands work as documented
- [ ] Example code is correct and functional
- [ ] Error messages are helpful

---

## Final Checklist

- [ ] All tests pass (`npm run test`)
- [ ] All keyboard navigation checks pass
- [ ] Screen reader smoke test passes
- [ ] At least one browser from each vendor has been tested
- [ ] Light and dark themes are both accessible
- [ ] Reduced motion mode is respected
- [ ] Forced colours mode remains usable
- [ ] Zoom and text resize work correctly
- [ ] Mobile touch targets are appropriate
- [ ] Narrow, medium and wide viewports work
- [ ] No console errors or warnings
- [ ] No accessibility violations detected
- [ ] Visual design is consistent and polished

---

## Notes

Document any findings, exceptions or known issues here:

_[Add notes as needed]_

---

**Test date:** ___________

**Tester:** ___________

**Browser/OS:** ___________

**Result:** ☐ PASS ☐ FAIL ☐ PARTIAL

**Last updated:** 2026-11-07. This checklist is not executed by `npm test`; record manual results above when those checks are performed.

**Phase 2C manual status:** Not yet performed. VoiceOver, NVDA, actual browser zoom, mobile touch, and cross-browser forced-colours checks remain outstanding; automated Chromium results are recorded separately.

**Phase 3A manual status:** Not yet performed. VoiceOver, NVDA, actual 200% text resizing and 400% browser zoom, mobile viewport behavior, and Firefox/WebKit layout checks remain outstanding; automated Chromium results are recorded separately.

