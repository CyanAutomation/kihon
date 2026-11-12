# Content, search, and state patterns

## Grouped collection and selection

**Intent:** Help people scan peer items, compare their summaries, and open one item's detail without losing the collection context.

**Use when:** The items form a meaningful, ordered collection and the next step is to inspect or act on one item.

**Avoid when:** There is only one item, the hierarchy is a set of stable destinations (use navigation links), or the content is better represented by a comparison table.

**Recommended structure:** Use a named section with a heading, a native list, and one button or link per row. A row summary contains a concise title, date/status, and one useful secondary value. Keep independent row actions as separate controls rather than nesting one button inside another.

**Expected behavior:** On wider layouts, selecting a row updates the detail region and indicates the selected row semantically. At compact widths, show the selected detail as its own readable view and provide an explicit return control. Preserve the selected item across resizing. If the item is removed or becomes unavailable, show a useful empty selection state.

**Platform variation:** Compact touch prioritizes one item and an easy return path. Tablet keeps list and detail together where both remain readable. Desktop may add a sidebar and additional metadata, but should preserve the same selection semantics.

**Accessibility:** The list remains a list. Each row has a unique accessible name; selection is conveyed with semantics and not color alone. The detail heading identifies the selected item. Moving to detail may move focus to its heading; returning restores focus to the initiating row.

**Browser limitation:** A web list does not get native split-view selection, persistent navigation state, or OS-provided swipe-back. The consumer owns the URL/history model if selecting an item is a shareable destination.

**Reference:** [iPad training library](../../style-guide/experience/ipad-library.html) demonstrates list/detail selection in a local mock screen.

**Acceptance:** Keyboard, pointer, and touch can select a row; a compact user can return to the list; resize does not lose selection; a direct URL reproduces selection when the consumer treats detail as a route.

## Search

**Intent:** Narrow a collection using words people recognize from its visible titles and summaries.

**Use when:** The collection is large enough to scan slowly or has a clear match on fields people can predict.

**Avoid when:** There are only a few items, filtering criteria are hidden, or search is being used to replace useful grouping.

**Recommended structure:** Provide a visible label for a native search input. Describe the searchable fields when ambiguity is possible. Keep query, filter, and clear actions available with the keyboard; preserve a useful result order.

**Expected behavior:** Filter local results immediately or show a labeled loading state for remote search. Do not discard a selected item or an unsaved edit merely because it is filtered out. Clearing the query restores the collection. A zero-result state says what was searched and provides a clear-query action.

**Platform variation:** Compact layouts may use a full-width search field; wider layouts may keep search beside list controls. Do not hide it behind hover or a gesture.

**Accessibility:** Announce a concise result count when asynchronous or when filtering materially changes the visible list. Do not announce on every keystroke if that creates noisy speech. Preserve focus in the search field and do not move it into the first result unexpectedly.

**Browser limitation:** Input suggestions, keyboard presentation, and autofill differ by browser and OS. Native search input styling and the device keyboard are browser-controlled.

**Reference:** Search the list in the [iPad training library](../../style-guide/experience/ipad-library.html).

**Acceptance:** Label is visible; keyboard users can edit and clear; no-results has a recovery action; filtering does not silently lose a draft or make the selected detail unreachable.

## Empty, loading, error, and progress states

**Intent:** Explain what content or work is present, pending, missing, or failed, and give a next step.

**Use when:** The user is waiting for a meaningful operation, has no matching or saved content, or needs to recover from failure.

**Avoid when:** A decorative spinner would be shown for work that completes before it can be perceived, or when a toast would conceal an actionable error.

**Recommended structure:** Place a state heading and plain-language explanation in the relevant content region. Pair progress with a native progress element or a status message; pair an error with a retry, edit, or return action. An empty collection offers a relevant create/import/filter action where the user has permission.

**Expected behavior:** Keep existing content stable when refreshing it. Prevent duplicate submissions while a save is pending, but keep the control's accessible name. Report completion or failure in a status region. Retrying should not duplicate a write. Preserve entered data after recoverable errors.

**Platform variation:** Use shorter copy and one clear recovery action in compact layouts. Desktop can add troubleshooting context without hiding the next action. A sheet is not a loading indicator.

**Accessibility:** Do not communicate status by color or animation alone. Use a polite live region for routine completion and progress; reserve urgent announcements for user-blocking errors. Ensure progress has a label and a determinate value when one is known. Do not auto-dismiss important errors.

**Browser limitation:** A web app cannot guarantee background progress after the page is suspended. Service workers are not a general-purpose user-interface thread or durable job runner.

**Reference:** The session capture form and sample analytics demonstrate visible completion, sample data, and a local CSV export. Network loading and error recovery remain consumer-owned and are not simulated in the references.

**Acceptance:** Each state names what happened and what the user can do; errors preserve recoverable work; progress has a text equivalent; reduced motion leaves the same state information available.
