import App from '../lib/App';
import Listener from '../lib/Listener';
import Page from '../lib/Page';
import Player from '../lib/Player';
import Notifications from '../lib/Notifications';

const parasiteLoseTemplate = require('../templates/parasiteLose.hbs');

export default () => {
	const toGameBtnId = 'toGameBtn';

	App.render(parasiteLoseTemplate({ toGameBtnId }));
	Notifications.sentNotification('You lost!');
	Listener.onClick(toGameBtnId, () => {
		if (Player.crew.isModerator()) {
			Page.goTo('createOverview');
		} else {
			Page.goTo('crewOverview');
		}
	});
	App.router.navigate('/parasiteLose');
};
