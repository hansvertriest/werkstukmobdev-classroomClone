import App from '../lib/App';

const newPasswordTemplate = require('../templates/newPassword.hbs');

export default () => {
	const title = 'newPassword automatic';

	App.render(newPasswordTemplate({ title }));
	App.router.navigate('/newPassword');
};
