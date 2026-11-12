# Native and web capability boundary

The browser offers useful platform integration, but it does not provide every SwiftUI or OS service. This table is deliberately conservative: exact support depends on the current browser, OS, secure context, permissions, user gesture, and install context.

| Capability | Browser-standard web | Apple-specific or WebKit-specific | Installed app context | Native wrapper / SwiftUI |
| --- | --- | --- | --- | --- |
| Semantic controls, focus, responsive CSS, browser history | Yes | Browser implementation varies | Same web semantics | May add native navigation integration |
| Manifest identity, icons, display preference | Yes, support differs | iOS/iPadOS Home Screen behavior has changed; on Safari 26+, users choose whether to open as a web app | Useful but not a guarantee of a fixed window | Native app metadata and distribution |
| Safe-area CSS insets and dynamic viewport units | Standardized CSS, implementation varies | Safari/WebKit behavior must be checked on the target OS | Must be checked separately from browser tabs | Native layout guides provide OS-owned geometry |
| Web Push and badges | Browser/OS support varies | WebKit provides Home Screen web app support on eligible iOS/iPadOS versions | Installation and permission state matter | Native notification entitlements and APIs |
| Offline resource cache | Service Worker API where supported | Storage eviction and lifecycle policy differ | Still subject to browser-managed storage/lifecycle | Can use native storage and background work policy |
| Background execution | No general guarantee for arbitrary pages | Platform may provide limited events; not a durable task scheduler | Installation does not guarantee continuous execution | Use native background task APIs subject to OS policy |
| Device posture and viewport segments | Standard support is not universal | Safari 27.1 preview on iPhone Duo is behind feature flags | Not a production assumption | Native APIs on supported device classes |
| System menu bar, window chrome, full platform navigation | No reliable control over browser chrome | Limited PWA window integration varies by platform | Browser chooses much of the chrome and launch flow | Native framework owns those system surfaces |
| Persistent keychain, privileged hardware, guaranteed system integration | No general web API equivalent | Some narrower APIs exist with permission/version limits | Installation does not grant privilege | Native wrapper or SwiftUI is required when these guarantees are product requirements |

## Decision rule

Use a standard web API when it is supported across the application's declared matrix and a no-API fallback preserves the task. Use an Apple-only web capability only as optional enhancement with feature detection and a browser path. Choose a native wrapper when the product requires a system guarantee that the web platform does not promise.

Do not encode a capability assumption in a user-agent branch. Detect the capability, request permission in user context, handle denial, and keep the basic task available.

## Current research notes

WebKit's Safari 26 release notes say that iOS 26 and iPadOS 26 users may add any site to the Home Screen and choose Open as Web App; a manifest remains useful for metadata and preferences. Safari 27.1's Device Posture and Viewport Segments support on iPhone Duo is explicitly a preview behind feature flags. Neither fact implies that every PWA has native lifecycle, full-screen control, or a stable virtual-keyboard viewport.
