import App from '../lib/App';
import Page from '../lib/Page';
import Player from '../lib/Player';
import Listener from '../lib/Listener';

const createSettingsTemplate = require('../templates/createSettings.hbs');

const getMemberData = async () => {
	const settingsQuery = App.firebase.getQuery(['crews', Player.getCrewCode()]);
	const crewDoc = await settingsQuery.get();
	const { gameSettings } = crewDoc.data();
	let description;
	let modifierParasite;
	let modifierPlague;
	if (gameSettings.gameMode === 'parasite') {
		description = 'The alien monster carries a dangerous parasite with him! When he catches a crew member the parasite will jump to him/her. Now he/she is the alien monster and will try to catch the others!';
		modifierParasite = 'a-button-container__button--active';
		modifierPlague = '';
	} else {
		description = 'When the alien monster catches a crew member, this member will turn in an alien too and together they will try to infect the others! This untill there are no crew members left or the time runs out. You win by being the last astronaut.';
		modifierParasite = '';
		modifierPlague = 'a-button-container__button--active';
	}
	return {
		settings: {
			description,
			modifierParasite,
			modifierPlague,
			radius: gameSettings.radius,
			duration: gameSettings.duration,
		},
	};
};

export default async () => {
	const playBtnId = 'playBtn';
	const playBtnIcon = 'play-solid'; // or pause-solid
	const navIdInvite = 'invite';
	const navIdOverview = 'overview';
	const navIdSettings = 'settings';
	const backBtnId = 'backBtn';
	const plagueBtnId = 'plagueBtn';
	const parasiteBtnId = 'parasiteBtn';
	const radiusFieldId = 'radiusField';
	const durationFieldId = 'durationField';

	const data = await getMemberData();

	App.render(createSettingsTemplate({
		data,
		playBtnId,
		playBtnIcon,
		navIdInvite,
		navIdOverview,
		navIdSettings,
		backBtnId,
	}));
	Page.goTo('/createSettings');

	/*
		Event listeners
	*/

	// navigation
	Listener.onClick(navIdInvite, () => {
		Page.goTo('/createInvite');
	});
	Listener.onClick(navIdOverview, () => {
		Page.goTo('/createOverview');
	});
	Listener.onClick(navIdSettings, () => {
		Page.goTo('/createSettings');
	});

	// selecting gameMode
	let gameMode;
	Listener.onClick(parasiteBtnId, () => {
		gameMode = 'parasite';
	});


	Listener.onClick(plagueBtnId, () => {
		gameMode = 'plague';
	});

	// Go back
	Listener.onClick(backBtnId, async () => {
		if (Player.crew.isInGame) {
			Page.goTo('game');
		} else {
			// get settings
			const duration = parseInt(document.getElementById(durationFieldId).value, 10);
			const radius = parseInt(document.getElementById(radiusFieldId).value, 10);
			// set settings
			Player.crew.setSettings(duration, radius, gameMode);
			// got to last page
			Page.goTo(Page.lastPage);
		}
	});

	// start game
	Listener.onClick(playBtnId, async () => {
		// get settings
		const duration = parseInt(document.getElementById(durationFieldId).value, 10);
		const radius = parseInt(document.getElementById(radiusFieldId).value, 10);
		// set settings
		Player.crew.setSettings(duration, radius, gameMode);
		// get location
		const currentLocation = await Player.getLocation();
		// start game
		await Player.crew.startGame(currentLocation);
		console.log(Player.locationAccuracy);
	});

	// listen to game start
	const inGame = await Player.crew.isInGame();
	if (!inGame) {
		const gameQuery = App.firebase.getQuery(['crews', Player.getCrewCode()]);
		const gameStartListener = await Listener.onSnapshot(gameQuery, async (crewDoc) => {
			const { gameSettings } = crewDoc.data();
			console.log('ee');
			// check if game isn't already running
			if (gameSettings.inGame) {
				Page.goTo('game');
				gameStartListener();
			}
		});
	}
};
