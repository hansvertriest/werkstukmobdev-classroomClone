import App from '../lib/App';
import Page from '../lib/Page';
import Player from '../lib/Player';
import Notifications from '../lib/Notifications';
import Listener from '../lib/Listener';

const crewOverviewTemplate = require('../templates/crewOverview.hbs');

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
	/* DOM variables */
	const leaveBtnId = 'leaveBtn';

	let gameStartListener;
	// listen to members
	const memberQuery = App.firebase.getQuery(['crews', Player.getCrewCode()], ['members']);
	const memberListener = await memberQuery.onSnapshot(async (docs) => {
		const memberIds = docs.docs.map((document) => document.id);
		const data = {
			crew: await getMemberData(memberIds),
		};

		await Player.crew.loadMembers();

		App.render(crewOverviewTemplate({ data, leaveBtnId }));

		App.router.navigate('/crewOverview');

		// leave crew
		Listener.onClick(leaveBtnId, () => {
			Player.leaveCrew();
			memberListener();
			if (gameStartListener !== undefined) {
				gameStartListener();
			}
			Page.goTo('home');
		});

		// listen to game start
		const gameQuery = App.firebase.getQuery(['crews', Player.getCrewCode()]);
		gameStartListener = await gameQuery.onSnapshot(async (crewDoc) => {
			const { gameSettings, taggers } = crewDoc.data();
			if (gameSettings.inGame) {
				if (!taggers.includes(Player.getUserId())) {
					await Player.getLocationFromGps()
						.then(async (location) => {
							await Player.updateLocation(location);
							gameStartListener();
							memberListener();
							Notifications.sentNotification('Game started!');
							Page.goTo('game');
						})
						.catch((error) => {
							console.log(error);
							gameStartListener();
							memberListener();
							Page.goTo('connectionLost');
						});
				} else {
					gameStartListener();
					memberListener();
					Page.goTo('gameStart');
				}
			}
		});
	});
};
