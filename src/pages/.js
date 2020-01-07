import App from '../lib/App';

const Template = require('../templates/.hbs');

export default () => {
	const title = ' automatic';

	App.render(Template({ title }));
	App.router.navigate('/');
};
