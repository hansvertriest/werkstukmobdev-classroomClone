import App from '../lib/App';

const passwordSentTemplate = require('../templates/passwordSent.hbs');

export default () => {
	const title = 'passwordSent automatic';

	App.render(passwordSentTemplate({ title }));
	App.router.navigate('/passwordSent');
};
