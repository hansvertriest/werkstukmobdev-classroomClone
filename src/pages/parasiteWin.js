import App from '../lib/App';
import Listener from '../lib/Listener';
import Page from '../lib/Page';
import Player from '../lib/Player';
import Notifications from '../lib/Notifications';

const parasiteWinTemplate = require('../templates/parasiteWin.hbs');

export default async () => {
	const toGameBtnId = 'toGameBtn';

	App.render(parasiteWinTemplate({ toGameBtnId }));

	Notifications.sentNotification('You won!');
	Listener.onClick(toGameBtnId, () => {
		if (Player.crew.isModerator()) {
			Page.goTo('createOverview');
		} else {
			Page.goTo('crewOverview');
		}
	});
	App.router.navigate('/parasiteWin');
};
