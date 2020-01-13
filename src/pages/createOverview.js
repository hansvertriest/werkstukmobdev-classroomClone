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
			userId: member,
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
	const playBtnId = 'id';
	const playBtnIcon = (Player.crew.isInGame()) ? '../assets/icons/fontawesome/pause-solid.svg' : '../assets/icons/fontawesome/play-solid.svg';
	const navIdInvite = 'invite';
	const navIdOverview = 'overview';
	const navIdSettings = 'settings';
	const backBtnId = 'backBtn';

	// listen to members
	const memberQuery = App.firebase.getQuery(['crews', Player.getCrewCode()], ['members']);
	const memberListener = await memberQuery.onSnapshot(async (docs) => {
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

		// change the button icon: play or pause
		if (Player.crewExists() && Player.crew.isInGame()) {
			document.getElementById(playBtnId).src = '../assets/icons/fontawesome/pause-solid.svg';
			document.getElementById(playBtnId).style.position = 'inherit';
		}
		Page.goTo('createOverview');

		/*
			Event listeners
		*/

		// navigation
		Listener.onClick(navIdInvite, () => {
			Page.goTo('createInvite');
			memberListener();
		});
		Listener.onClick(navIdOverview, () => {
			Page.goTo('createOverview');
			memberListener();
		});
		Listener.onClick(navIdSettings, () => {
			Page.goTo('createSettings');
			memberListener();
		});

		data.crew.forEach((member) => {
			Listener.onClick(`${member.userId}-delete`, () => {
				Player.crew.removeMember(member.userId);
			});
		});

		// Go back
		Listener.onClick(backBtnId, () => {
			if (Player.crew.isInGame()) {
				Page.goTo('/game');
				memberListener();
			} else {
				Page.goTo('home');
				memberListener();
			}
		});

		// start/stop game
		Listener.onClick(playBtnId, async () => {
			if (Player.crew.isInGame()) {
				// stop game
				Player.crew.stopGame();
				memberListener();
				App.router.navigate('home');
			} else {
				// get location
				memberListener();
				Page.goTo('game');
				navigator.geolocation.getCurrentPosition(
					async (position) => {
						await Player.crew.startGame(position);
						await Player.updateLocation(position);
						memberListener();
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
	});
};
