// El Service Worker se sacó del sistema (causaba que hubiera que recargar la
// página más de una vez para ver datos actualizados). Este script solo limpia
// el que haya quedado instalado en el navegador de usuarios que ya lo tenían.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}
if (window.caches) {
  caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
}
