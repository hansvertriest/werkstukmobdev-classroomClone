import App from '../lib/App';
import Listener from '../lib/Listener';
import Player from '../lib/Player';
import Page from '../lib/Page';

const homeTemplate = require('../templates/home.hbs');

export default () => {
	/* page data */
	const data = {
		screenName: Player.getScreenName(),
		avatar: `../assets/images/avatar/${Player.getAvatar()}_128.png`,
	};
	/* DOM variables */
	const joinBtnId = 'joinBtn';
	const createBtnId = 'createBtn';
	const logOutBtnId = 'logOutBtn';

	App.render(homeTemplate({
		data,
		joinBtnId,
		createBtnId,
		logOutBtnId,
	}));

	/* Event listeners */

	// logout
	Listener.onClick(logOutBtnId, () => {
		App._firebase.getAuth().signOut().then(async () => {
			Player.logOut();
			Page.goTo('login');
		}, (error) => {
			console.log(error);
		});
	});

	// Go to join page
	Listener.onClick(joinBtnId, () => {
		Page.goTo('join');
	});

	// Go to create page
	Listener.onClick(createBtnId, () => {
		Page.goTo('createInvite');
	});

	App.router.navigate('/home');
};
