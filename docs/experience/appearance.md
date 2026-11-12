# Shared principles and appearance

## Intent

Keep one product identity across iPhone, iPad, and Mac while adapting hierarchy, spacing, navigation, and information density to the task and available space. Content remains primary; platform cues should help people understand location, available actions, and selection.

## Typography and density

- Retain the system-font stack, semantic text roles, readable line lengths, and user-resizable text. Do not ship an Apple font or require a specific installed font.
- Use larger hierarchy and fewer simultaneous controls in compact touch contexts. Let adaptive tablet layouts expose useful list/detail context. Desktop may display more columns, metadata, and shortcuts when they improve analysis.
- Density changes must preserve labels, readable descriptions, focus visibility, and reflow at 200% text size and 400% zoom.
- Do not use fixed device dimensions as content widths. Use flexible grid/flex tracks, max-widths for reading, and a content-driven breakpoint.

## Colour and theme policy

Kihon already supports light, dark, and explicit system appearance. The current public default is dark. Phase 5A recommends system-following as the future default because a system preference is user intent and native controls already follow color-scheme; that change requires an explicit compatibility and migration decision in a future release. Until then, consumers choose system mode with data-kh-theme="system" and can continue to force light or dark.

Keep accent color for a small number of primary actions and selected states. Pair every visual state with text, shape, position, or native checked/current semantics. Recheck actual foreground/background and focus combinations in both themes; do not infer contrast from token names.

## Surfaces and materials

Apple's current Liquid Glass guidance describes a functional layer for navigation and controls above a content layer and cautions against using that material as content decoration. Kihon takes the structural lesson: distinguish navigation/action surfaces from content surfaces and preserve the content beneath. It does not reproduce glass.

- Default to opaque surfaces with borders or spacing for hierarchy.
- Use translucency only when content beneath remains legible, the effect has a purpose, and an opaque fallback is defined.
- Blur, shadow, and rounding are optional visual details, never the only signal for hierarchy or state.
- Avoid fake status bars, traffic-light window buttons, copied system icons, or a faux Safari frame.
- Respect forced colors and reduced transparency settings where available; usability must not rely on a backdrop effect.

## Controls and surface separation

The current button target is at least 48 CSS px high through the standard spacing scale, exceeding Kihon's existing 44 px touch recommendation. Preserve generous targets for frequent touch actions. A desktop density variant can be smaller only when the target remains operable, separated from adjacent targets, and documented as an intentional pointer/keyboard choice.

Use borders, tonal surfaces, spacing, and section labels to group content. Do not put every field or metric in a separate card. A navigation bar may visually sit above content, but should not obscure headings, focused controls, or scroll destinations.

## When to depart

Use a product-specific visual direction when brand, task, data, or audience calls for it. Keep the semantic contract, input parity, state communication, contrast, and URL behavior. Do not add tabs, sidebars, translucency, or device-specific chrome merely to signal that an interface is native-inspired.
