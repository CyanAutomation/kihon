# Installed web app guidance

An installed web app is still web content running in a browser engine. Installation can change window chrome, launch entry points, and some available integrations; it does not turn the app into SwiftUI or guarantee a fixed viewport or background process.

## Manifest and launch

- Serve a valid Web App Manifest over HTTPS with a stable id, name/short_name, start_url, scope, icons, and a display preference appropriate to the app.
- Prefer standalone when a separate app-like window is useful. Keep browser display as a valid fallback. Use display_override only for an optional capability with a supported fallback.
- Provide purpose-designed original icons, including appropriate maskable variants where supported. Set a deliberate page theme color and document background color. Avoid relying on a launch screenshot as the only loading state.
- Do not make core workflows depend on a browser install prompt or a particular installation route.
- In Safari 26 and later, iOS/iPadOS users can choose Open as Web App when adding a site to the Home Screen regardless of a manifest. A manifest still supplies useful app metadata and display preferences. macOS Dock web apps have their own install flow. Detect the actual display context when a presentation difference is needed; do not assume installation from a user agent.
- No install prompt is added by Kihon. The consumer owns its manifest, deployment headers, icon artwork, install education, and supported OS policy.

## Safe area and viewport

- Set the viewport meta declaration intentionally. Use viewport-fit=cover only when the page design handles inset edges and includes safe-area padding.
- Use env(safe-area-inset-top/right/bottom/left, 0px) for controls that can approach display cutouts or system overlays. Add normal design spacing to the inset; do not treat the inset itself as the full component padding.
- Prefer min-height: 100vh as a fallback followed by dynamic viewport sizing where appropriate. Use 100dvh for a region that should match currently visible browser space only after checking Safari and installed-app behavior. Do not assume 100vh equals the visible area.
- Keep ordinary document scrolling. Avoid a full-viewport fixed shell unless the workflow demonstrably needs it and has been checked with browser chrome, rotation, keyboard, zoom, and assistive technology.
- Anchor action bars with safe-area padding and scroll the focused field into view. Do not cover the field, validation text, or submit control with a fixed footer.
- The VisualViewport API can help observe keyboard and zoom changes when a layout has a specific need. Feature-detect it, debounce/coordinate changes, and keep the CSS/native scrolling path as the fallback. Avoid hard-coded keyboard heights.

## Keyboard, scroll, and browser differences

- Use inputmode, autocomplete, type, and enterkeyhint only when they match the task. Do not suppress zoom or browser text selection to make a screen look more native.
- Keep forms and content scrollable when the virtual keyboard appears. Test focusing and dismissing controls in Safari and installed Home Screen apps on real devices; they can differ.
- Use overscroll-behavior only for deliberate nested scrolling. Preserve pull-to-refresh and browser/system edge gestures unless a tested product requirement demands otherwise.
- Keep the page functional when browser chrome expands, hides, or changes available height.
- Treat status-bar styling as an OS/browser integration with version-specific behavior. A theme-color declaration and safe-area CSS do not grant control over every status bar or installed-app launch surface. Test any legacy Apple-specific meta setting on the supported OS versions.

## Offline, persistence, and recovery

- A service worker is a consumer-owned caching decision, not a Kihon requirement. Define which resources and data are safe to cache, how updates activate, how stale data is labeled, and how users retry synchronization.
- Preserve an unfinished form locally only when the application has an explicit privacy, retention, and conflict policy. Tell people when a draft is saved, offline, or awaiting synchronization.
- Treat background suspension as normal. On return, re-check data freshness, authentication, pending writes, and visibility-dependent timers. Do not assume a continuously running JavaScript process.
- Make online recovery idempotent so retrying after a dropped connection does not duplicate a saved record.

## Platform capability boundary

Browser-standard features such as semantic controls, history, storage, service workers, and manifest metadata work according to each browser's support. Some WebKit capabilities apply only to particular OS releases or installation contexts. A native wrapper is required when the product needs guaranteed background execution, privileged native integrations, or platform behavior unavailable through supported web APIs.

For an application-specific capability list and test requirements, see [native and web capabilities](native-web-capabilities.md) and the [validation matrix](validation.md).
