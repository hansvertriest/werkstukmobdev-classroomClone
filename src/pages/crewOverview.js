import App from '../lib/App';
import Page from '../lib/Page';
import Player from '../lib/Player';
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

	// listen to members
	const memberQuery = App.firebase.getQuery(['crews', Player.getCrewCode()], ['members']);
	const memberListener = Listener.onSnapshot(memberQuery, async (docs) => {
		const memberIds = docs.docs.map((document) => document.id);
		const data = {
			crew: await getMemberData(memberIds),
		};

		await Player.crew.loadMembers();

		App.render(crewOverviewTemplate({ data, leaveBtnId }));

		// leave crew
		Listener.onClick(leaveBtnId, () => {
			Player.leaveCrew();
			Page.goTo('home');
			memberListener();
		});
	});

	// listen to game start
	const inGame = await Player.crew.isInGame();
	if (!inGame) {
		const gameQuery = App.firebase.getQuery(['crews', Player.getCrewCode()]);
		const gameStartListener = await Listener.onSnapshot(gameQuery, async (crewDoc) => {
			const { gameSettings } = crewDoc.data();
			if (gameSettings.inGame) {
				Page.goTo('game');
				gameStartListener();
				memberListener();
			}
		});
	}
	App.router.navigate('/crewOverview');
};
