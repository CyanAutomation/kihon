/** Optional controller for a native, labelled sidebar navigation landmark. */
export interface SidebarOptions {
    sidebar: HTMLElement;
    toggleButton: HTMLButtonElement;
    shell?: HTMLElement;
    initialExpanded?: boolean;
}
export interface SidebarController {
    expand(): void;
    collapse(): void;
    toggle(): void;
    dispose(): void;
}
export interface KihonSidebarAPI {
    createSidebarController(options: SidebarOptions): SidebarController;
}
declare global {
    interface Window {
        KihonSidebar?: KihonSidebarAPI;
    }
}
/**
 * Add optional collapse/reveal behavior to a visible-by-default sidebar.
 * The controller owns aria-expanded and the app-shell collapsed modifier until disposed.
 */
export declare function createSidebarController(options: SidebarOptions): SidebarController;
