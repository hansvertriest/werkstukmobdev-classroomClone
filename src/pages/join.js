import App from '../lib/App';
import Listener from '../lib/Listener';
import Player from '../lib/Player';
import Page from '../lib/Page';

const joinTemplate = require('../templates/join.hbs');

export default async () => {
	/* DOM variables */
	const joinBtnId = 'joinBtn';
	const codeFieldId = 'codeField';
	const backBtnId = 'backBtn';
	const errorContainerId = 'errorContainer';

	App.render(joinTemplate({
		joinBtnId,
		codeFieldId,
		backBtnId,
		errorContainerId,
	}));
	App.router.navigate('/join');

	/*
		Listeners
	*/

	// join crew
	Listener.onClick(joinBtnId, async () => {
		// check if given crew exists
		const crews = await App.firebase.getDocIds(['crews']);
		const crewToJoin = document.getElementById(codeFieldId).value;
		if (Player.crewExists() && Player.getCrewCode() === crewToJoin) {
			Page.goTo('createOverview');
		} else if (crews.includes(crewToJoin)) {
			await Player.joinCrew(crewToJoin);
			Page.goTo('crewOverview');
		} else {
			document.getElementById(errorContainerId).innerText = 'Could not find crew!';
		}
	});


	// Go back
	Listener.onClick(backBtnId, () => {
		Page.goTo('home');
	});

	/*
		Check for rerouting
	*/
	if (Player.crewExists()) {
		if (await Player.crew.getModerator() !== Player.getUserId()) {
			Page.goTo('crewOverview');
		}
	}
};
