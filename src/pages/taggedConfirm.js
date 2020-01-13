import App from '../lib/App';
import Listener from '../lib/Listener';
import Player from '../lib/Player';
import Notifications from '../lib/Notifications';

const taggedConfirmTemplate = require('../templates/taggedConfirm.hbs');

export default () => {
	const confirmBtnId = 'confirmBtn';
	const denyBtnId = 'denyBtn';

	App.render(taggedConfirmTemplate({
		confirmBtnId,
		denyBtnId,
	}));

	/*
		Add event listeners
	*/

	Listener.onClick(confirmBtnId, async () => {
		// update the taggers
		await Player.crew.changeTaggersTo([Player.getUserId()]);
		await Player.crew.removeTagRequest();
		// if (Notifications.getPermission()) {
		// 	Notifications.sentNotification("You're infected now. Infect someone else!");
		// }
		App.router.navigate('/game');
	});

	Listener.onClick(denyBtnId, async () => {
		await Player.crew.removeTagRequest();
		App.router.navigate('/game');
	});
};
