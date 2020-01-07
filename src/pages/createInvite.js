import App from '../lib/App';
import Player from '../lib/Player';
import Listener from '../lib/Listener';
import Page from '../lib/Page';

const createInviteTemplate = require('../templates/createInvite.hbs');

export default async () => {
	if (!Player.crewExists()) {
		await Player.createCrew();
	}

	const data = { crewCode: Player.getCrewCode() };

	const playBtnId = 'id';
	const playBtnIcon = 'play-solid'; // or pause-solid
	const navIdInvite = 'invite';
	const navIdOverview = 'overview';
	const navIdSettings = 'settings';
	const backBtnId = 'backBtn';

	App.render(createInviteTemplate({
		data,
		playBtnId,
		playBtnIcon,
		navIdInvite,
		navIdOverview,
		navIdSettings,
		backBtnId,
	}));

	/* Event listeners */

	// navigation
	Listener.onClick(navIdInvite, () => {
		Page.goTo('createInvite');
	});
	Listener.onClick(navIdOverview, () => {
		Page.goTo('createOverview');
	});
	Listener.onClick(navIdSettings, () => {
		Page.goTo('createSettings');
	});

	// Go back
	Listener.onClick(backBtnId, () => {
		Page.goTo('home');
	});

	// listen to game start
	const inGame = await Player.crew.isInGame();
	if (!inGame) {
		const gameQuery = App.firebase.getQuery(['crews', Player.getCrewCode()]);
		const gameStartListener = await Listener.onSnapshot(gameQuery, async (crewDoc) => {
			const { gameSettings } = crewDoc.data();
			if (gameSettings.inGame) {
				// memberListener();
				gameStartListener();
				Page.goTo('game');
			}
		});
	}
	App.router.navigate('/createInvite');
};
