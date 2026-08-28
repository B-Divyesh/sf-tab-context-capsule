import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  // A deliberately empty service worker keeps the MV3 package inspectable.
  // Capture and storage work only when the user opens the popup.
});
