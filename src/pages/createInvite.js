import App from '../lib/App';
import Player from '../lib/Player';
import Listener from '../lib/Listener';
import Page from '../lib/Page';

const createInviteTemplate = require('../templates/createInvite.hbs');

export default async () => {
	if (!Player.crewExists()) {
		await Player.createCrew();
	} else if (!await Player.isModerator()) {
		await Player.createCrew();
	}

	const data = { crewCode: Player.getCrewCode() };

	const playBtnId = 'id';
	const playBtnIcon = (Player.crew.isInGame()) ? '../assets/icons/fontawesome/pause-solid.svg' : '../assets/icons/fontawesome/play-solid.svg';
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
		if (Player.crew.isInGame()) {
			Page.goTo('/game');
		} else {
			Page.goTo('home');
		}
	});

	// change the button icon: play or pause
	if (Player.crewExists() && Player.crew.isInGame()) {
		document.getElementById(playBtnId).src = '../assets/icons/fontawesome/pause-solid.svg';
		document.getElementById(playBtnId).style.position = 'inherit';
	}

	// start/stop game
	Listener.onClick(playBtnId, async () => {
		if (Player.crew.isInGame()) {
			// stop game
			Player.crew.stopGame();
			App.router.navigate('createInvite');
		} else {
			// get location
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					// start game
					await Player.crew.startGame(position);
					await Player.updateLocation(position);
					Page.goTo('game');
				},
				(error) => {
					console.log(error);
					Page.goTo('connectionLost');
				},
				{
					// enableHighAccuracy: true,
					timeout: 10000,
				},
			);
		}
	});
	App.router.navigate('/createInvite');
};
