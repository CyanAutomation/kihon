import {
  createSidebarController,
  type KihonSidebarAPI,
  type SidebarController,
  type SidebarOptions
} from '../../src/js/sidebar';

declare const sidebar: HTMLElement;
declare const toggleButton: HTMLButtonElement;

const options: SidebarOptions = { sidebar, toggleButton, initialExpanded: true };
const controller: SidebarController = createSidebarController(options);
controller.expand();
controller.collapse();
controller.toggle();
controller.dispose();

const api: KihonSidebarAPI = { createSidebarController };
if (window.KihonSidebar) window.KihonSidebar.createSidebarController(options);
api.createSidebarController(options);
