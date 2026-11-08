import {
  closeDialog,
  disposeDialog,
  openDialog,
  type DialogOpenOptions
} from '../../src/js/dialogs.js';

const dialog = document.createElement('dialog');
const trigger = document.createElement('button');
const options: DialogOpenOptions = {
  trigger,
  initialFocus: trigger,
  fallbackFocus: trigger
};

openDialog(dialog, options);
closeDialog(dialog, 'save');
disposeDialog(dialog);
window.KihonDialogs?.openDialog(dialog, options);
