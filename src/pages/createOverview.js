import App from '../lib/App';
import Page from '../lib/Page';
import Player from '../lib/Player';
import Listener from '../lib/Listener';

const createOverviewTemplate = require('../templates/createOverview.hbs');


const getMemberData = async (members) => new Promise((resolve) => {
	const memberArray = [];
	members.forEach(async (member) => {
		const userDoc = await App.firebase.getQuery(['users', member]).get();
		const { avatar, screenName } = userDoc.data();
		const isModerator = (Player.getUserId() === await Player.crew.getModerator());
		memberArray.push({
			avatar,
			screenName,
			isModerator,
		});
		if (memberArray.length === members.length) {
			resolve(memberArray);
		}
	});
});

export default async () => {
	const playBtnId = 'id';
	const playBtnIcon = 'play-solid'; // or pause-solid
	const navIdInvite = 'invite';
	const navIdOverview = 'overview';
	const navIdSettings = 'settings';
	const backBtnId = 'backBtn';

	// listen to members
	const memberQuery = App.firebase.getQuery(['crews', Player.getCrewCode()], ['members']);
	const memberListener = await Listener.onSnapshot(memberQuery, async (docs) => {
		console.log('listener running');
		const memberIds = docs.docs.map((document) => document.id);
		const data = {
			crew: await getMemberData(memberIds),
		};

		await Player.crew.loadMembers();

		// render the page
		App.render(createOverviewTemplate({
			data,
			playBtnId,
			playBtnIcon,
			navIdInvite,
			navIdOverview,
			navIdSettings,
			backBtnId,
		}));
		Page.goTo('/createOverview');

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

		// Go back
		Listener.onClick(backBtnId, () => {
			if (Player.crew.isInGame) {
				Page.goTo('/game');
			} else {
				Page.goTo(Page.lastPage);
			}
		});

		// start game
		Listener.onClick(playBtnId, async () => {
			// get location
			const currentLocation = await Player.getLocation()
				.catch((error) => {
					console.log(error);
				});
			// start game
			await Player.crew.startGame(currentLocation);
			console.log(Player.locationAccuracy);
		});
	});

	// listen to game start
	const inGame = await Player.crew.isInGame();
	if (!inGame) {
		const gameQuery = App.firebase.getQuery(['crews', Player.getCrewCode()]);
		const gameStartListener = await Listener.onSnapshot(gameQuery, async (crewDoc) => {
			const { gameSettings } = crewDoc.data();
			if (gameSettings.inGame) {
				memberListener();
				gameStartListener();
				Page.goTo('game');
			}
		});
	}
};
