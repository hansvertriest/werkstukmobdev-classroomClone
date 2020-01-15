
/* eslint-disable no-restricted-globals */

// set the debug state
const DEBUG = true;

/**
 * When Service Worker is installed
 */
self.addEventListener('install', (e) => {
	if (DEBUG) console.log('[Serviceworker] installed.');
	e.waitUntil(
		caches
			.open('v1') // The cache name
			.then((cache) => {
				const assetsToCache = ['offline.html'];
				cache.addAll(assetsToCache);
			})
			.catch((error) => {
				console.error(error);
			}),
	);
});

/**
 * When Service Worker is active
 * After the install event
 */
self.addEventListener('activate', () => {
	if (DEBUG) console.log('[Serviceworker] active.');
});

/**
 * When the Fetch event is triggered
 */
self.addEventListener('fetch', (e) => {
	if (DEBUG) console.log('[ServiceWorker] Fetching', e.request.url);

	e.respondWith(
		fetch(e.request).catch(() => caches.match('offline.html')),
	);
});
