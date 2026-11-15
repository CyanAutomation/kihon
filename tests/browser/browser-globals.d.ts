interface Window {
  KihonDialogs?: {
    openDialog(dialog: HTMLDialogElement, options?: {
      trigger?: (Element & { focus(options?: FocusOptions): void }) | null;
      initialFocus?: (Element & { focus(options?: FocusOptions): void }) | null;
      fallbackFocus?: (Element & { focus(options?: FocusOptions): void }) | null;
    }): boolean;
    closeDialog(dialog: HTMLDialogElement, returnValue?: string): boolean;
    disposeDialog(dialog: HTMLDialogElement): boolean;
  };
  KihonSidebar?: {
    createSidebarController(options: {
      sidebar: HTMLElement;
      toggleButton: HTMLButtonElement;
      shell?: HTMLElement;
      initialExpanded?: boolean;
    }): {
      expand(): void;
      collapse(): void;
      toggle(): void;
      dispose(): void;
    };
  };
  __revokedObjectUrls: string[];
}
