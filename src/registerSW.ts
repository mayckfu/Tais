import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // In development, explicitly unregister any active service worker to avoid dev-sw reload loops
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
    return;
  }

  // In production builds, register cleanly without forcing automatic page reload loops
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Do not force automatic reload loop; avoid screen flickering
    },
    onOfflineReady() {
      console.log('Central DENF está pronta para funcionar offline.');
    },
  });
}
