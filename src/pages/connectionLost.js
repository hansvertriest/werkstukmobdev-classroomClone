import App from '../lib/App';
import Listener from '../lib/Listener';
import Page from '../lib/Page';

const connectionLostTemplate = require('../templates/connectionLost.hbs');

export default () => {
	/* DOM VARIABLES */
	const containerId = 'container';

	App.render(connectionLostTemplate({ containerId }));
	App.router.navigate('/connectionLost');


	// tap anywhere
	Listener.onClick(containerId, () => {
		Page.goToLastPage();
	});
};
