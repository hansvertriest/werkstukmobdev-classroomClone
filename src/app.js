import './styles/styles.scss';

import * as consts from './consts';
import App from './lib/App';
import routes from './routes';
import Player from './lib/Player';

/**
 * This function will initialize our app
 */
const initApp = () => {
	// create a DOM element for our renderer
	const app = document.createElement('div');
	app.setAttribute('id', 'app');
	document.body.appendChild(app);

	// 1. set the core
	App.initCore({
		mainUrl: window.location.origin,
		hash: consts.ROUTER_HASH,
		element: app,
	});

	// 2. init firebase (if needed)
	if (consts.INIT_FIREBASE) {
		App.initFireBase({
			apiKey: consts.FIREBASE_API_KEY,
			projectId: consts.FIREBASE_PROJECT_ID,
			messagingSenderId: consts.FIREBASE_MESSAGING_SENDER_ID,
		});
	}

	// 3. init localstorage
	App.initLocalStorage();
};

/**
 * This function will init the routes
 */
const initRoutes = () => {
	routes.forEach((route) => App.router.addRoute(route.path, route.view));
};

/**
 * When we are ready to go, init the app, routes and navigate to default route
 */
window.addEventListener('load', async () => {
	// init the app
	initApp();

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('sw.js');
	}

	// check user
	await App.firebase.getAuth().onAuthStateChanged(async (user) => {
		if (!user) {
			// init the routes
			initRoutes();
			App.router.navigate('/login');
		} else {
			console.log(`USER: ${user.uid}`);

			await Player.load(user.uid, true);
			// init the routes
			initRoutes();
			// route to the requested location (or default)
			let requestedPage = window.location.hash.split('/')[1];
			requestedPage = (requestedPage === null || typeof (requestedPage) === 'undefined') ? `/${consts.ROUTER_DEFAULT_PAGE}` : `/${requestedPage}`;
			App.router.navigate(requestedPage);
		}
	});
});
