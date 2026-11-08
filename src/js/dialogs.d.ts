export interface DialogFocusTarget extends Element {
    focus(options?: FocusOptions): void;
}
export interface DialogOpenOptions {
    trigger?: DialogFocusTarget | null;
    initialFocus?: DialogFocusTarget | null;
    fallbackFocus?: DialogFocusTarget | null;
}
export interface KihonDialogsAPI {
    openDialog(dialog: HTMLDialogElement, options?: DialogOpenOptions): boolean;
    closeDialog(dialog: HTMLDialogElement, returnValue?: string): boolean;
    disposeDialog(dialog: HTMLDialogElement): boolean;
}
declare global {
    interface Window {
        KihonDialogs?: KihonDialogsAPI;
    }
}
export declare function openDialog(dialog: HTMLDialogElement, options?: DialogOpenOptions): boolean;
export declare function closeDialog(dialog: HTMLDialogElement, returnValue?: string): boolean;
export declare function disposeDialog(dialog: HTMLDialogElement): boolean;
