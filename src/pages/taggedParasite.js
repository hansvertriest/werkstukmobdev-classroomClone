import App from '../lib/App';
import Listener from '../lib/Listener';

const taggedParasiteTemplate = require('../templates/taggedParasite.hbs');

export default () => {
	const toGameBtnId = 'toGameBtn';

	App.render(taggedParasiteTemplate({ toGameBtnId }));
	App.router.navigate('/taggedParasite');

	Listener.onClick(toGameBtnId, () => {
		App.router.navigate('game');
	});
};
