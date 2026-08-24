// This file handles the registration and updates of the service worker

// Define the service worker url
const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

// Register the service worker
export function register(config?: Config) {
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // Wait for window to load before registering
    window.addEventListener('load', () => {
      registerServiceWorker(config);
    });
  }
}

function registerServiceWorker(config?: Config) {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      // Check for updates
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available; we have an update
              console.log('New content is available and will be used when all tabs are closed.');
              if (config?.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Everything is cached for offline use
              console.log('Content is cached for offline use.');
              if (config?.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch(error => {
      console.error('Error during service worker registration:', error);
    });
}

// Check if the current service worker is still valid
export function checkValidServiceWorker() {
  // Check if the service worker can be found
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then(response => {
      // Ensure service worker exists, and that we get the expected response
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerServiceWorker();
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

// Unregister the service worker
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}
