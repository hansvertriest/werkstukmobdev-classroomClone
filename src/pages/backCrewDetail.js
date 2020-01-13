import App from '../lib/App';
import Backend from '../lib/Backend';
import Listener from '../lib/Listener';
import Page from '../lib/Page';

const backCrewDetailTemplate = require('../templates/backCrewDetail.hbs');

const collectData = async (backCrewCode) => {
	const crewMembers = await Backend.getCrewMembers(backCrewCode);
	const crewDoc = await App.firebase.getQuery(['crews', backCrewCode]).get();
	const { gameSettings } = crewDoc.data();
	const data = {
		crewCode: backCrewCode,
		members: crewMembers,
		inGame: gameSettings.inGame,
		centerpoint: gameSettings.centerPoint,
	};
	return data;
};

const pageScript = async () => {
	const backCrewCode = Backend.getCrewCode();
	const data = await collectData(backCrewCode);

	// DOM page variables
	const addUserBtnId = 'addUserBtn';
	const forceStartButtonId = 'forceStartButton';
	const status = (data.inGame) ? 'in game' : 'waiting for start';
	const startStopInnerText = (data.inGame) ? 'stop game' : 'start game';
	const simulateGameId = 'simulateGame';
	const mapBtnId = 'mapBtn';

	App.render(backCrewDetailTemplate({
		data,
		addUserBtnId,
		forceStartButtonId,
		status,
		startStopInnerText,
		simulateGameId,
		mapBtnId,
	}));

	App.router.navigate('/backCrewDetail');

	/*
		Eventlisteners
	*/

	// add random user
	Listener.onClick(addUserBtnId, () => {
		Backend.generateRandomUser(Backend.getCrewCode());
	});

	// stop/start game
	Listener.onClick(forceStartButtonId, () => {
		if (data.inGame) {
			Backend.stopGame(Backend.crewCode);
		} else {
			Backend.startGame(Backend.crewCode);
		}
	});

	// delete user
	data.members.forEach((member) => {
		const id = `a-delete-${member.userId}`;
		Listener.onClick(id, () => {
			Backend.deleteUserFromCrew(Backend.getCrewCode(), member.userId);
		});
	});

	// add a tagger
	data.members.forEach((member) => {
		const id = `a-addTagger-${member.userId}`;
		Listener.onClick(id, () => {
			Backend.addTagger(Backend.crewCode, member.userId);
			console.log('ee');
		});
	});


	// start simulation
	Listener.onClick(simulateGameId, () => {
		Backend.simulateGame();
	});

	// go to map
	Listener.onClick(mapBtnId, () => {
		App.router.navigate('/backMap');
	});
};

export default async () => {
	// check for change in members
	const memberQuery = App.firebase.getQuery(['crews', Backend.getCrewCode()], ['members']);
	memberQuery.onSnapshot(async () => {
		pageScript();
	});
};
