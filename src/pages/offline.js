import App from '../lib/App';

const offlineTemplate = require('../templates/offline.hbs');

export default () => {
	const title = 'offline automatic';

	App.render(offlineTemplate({ title }));
	App.router.navigate('/offline');
};
