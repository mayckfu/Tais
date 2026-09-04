import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        updateSW(true);
      },
      onOfflineReady() {
        console.log('Central DENF está pronta para funcionar offline em tablets e dispositivos móveis.');
      },
    });
  }
}
