import App from '../lib/App';

const taggedParasiteTemplate = require('../templates/taggedParasite.hbs');

export default () => {
	const title = 'taggedParasite automatic';

	App.render(taggedParasiteTemplate({ title }));
	App.router.navigate('/taggedParasite');
};
