import App from '../lib/App';
import Page from '../lib/Page';
import Listener from '../lib/Listener';

const gameStartTemplate = require('../templates/gameStart.hbs');


export default async () => {
	const doorId = 'door';

	App.render(gameStartTemplate({ doorId }));

	const doorElement = document.getElementById(doorId);
	let counter = 0;

	Listener.onClick(doorId, () => {
		counter++;
		if (counter % 2 === 0) {
			doorElement.style.marginTop = '30px';
		} else {
			doorElement.style.marginTop = '0';
		}
		if (counter === 30) {
			App.router.navigate('/game');
		}
	});
	App.router.navigate('/gameStart');
};
