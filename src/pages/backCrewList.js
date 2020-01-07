import App from '../lib/App';
import Listener from '../lib/Listener';
import Backend from '../lib/Backend';

const backCrewListTemplate = require('../templates/backCrewList.hbs');

export default async () => {
	/*
		Data
	*/

	const crewsDocs = await App.firebase.getQuery(['crews']).get();
	const crewArray = [];
	crewsDocs.forEach((crew) => {
		crewArray.push({ crewCode: crew.id });
	});
	const data = {
		crews: crewArray,
	};

	// Dom variables
	const deleteFictionalUsersBtnId = 'deleteFictionalUsersBtn';
	App.render(backCrewListTemplate({
		data,
		deleteFictionalUsersBtnId,
	}));

	// eventListeners
	data.crews.forEach((crew) => {
		Listener.onClick(crew.crewCode, () => {
			Backend.setCrewCode(crew.crewCode);
			App.router.navigate('/backCrewDetail');
		});
	});
	Listener.onClick(deleteFictionalUsersBtnId, () => {
		Backend.deleteFictionalusers();
	});
	App.router.navigate('/backCrewList');
};
