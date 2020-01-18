import App from '../lib/App';
import listener from '../lib/Listener';
import Player from '../lib/Player';

const registerTemplate = require('../templates/register.hbs');

const checkFormRequirements = (nameFieldId, errorContainerId) => {
	if (document.getElementById(nameFieldId).value === '') {
		document.getElementById(errorContainerId).innerText = 'Please choose a screen name!';
		return false;
	}
	return true;
};

export default () => {
	/* DOM variables	*/
	const nameFieldId = 'nameField';
	const emailFieldId = 'emailField';
	const passwordFieldId = 'passwordField';
	const submitBtnId = 'submiBbtn';
	const googleBtnId = 'googleBtn';
	const errorContainerId = 'errorContainer';

	App.render(registerTemplate({
		nameFieldId,
		emailFieldId,
		passwordFieldId,
		submitBtnId,
		googleBtnId,
		errorContainerId,
	}));
	App.router.navigate('/register');

	/* Event listeners */

	// Submitting registration
	listener.onClick(submitBtnId, () => {
		const screenName = document.getElementById(nameFieldId).value;
		const email = document.getElementById(emailFieldId).value;
		const password = document.getElementById(passwordFieldId).value;

		App._firebase.getAuth().createUserWithEmailAndPassword(email, password)
			.then((user) => {
				const userId = App.firebase.getAuth().currentUser.uid;
				Player.register(userId, screenName);
				App.router.navigate('/registerAvatar');
			})
			.catch((error) => {
				document.getElementById(errorContainerId).innerText = error.message;
			});
	});

	// Google authentication
	listener.onClick(googleBtnId, () => {
		if (checkFormRequirements(nameFieldId, errorContainerId)) {
			const screenName = document.getElementById(nameFieldId).value;
			App._firebase.getAuth().signInWithPopup(App._firebase.getProvider())
				.then((user) => {
					if (user) {
						const userId = App.firebase.getAuth().currentUser.uid;
						Player.register(userId, screenName);
						App.router.navigate('/registerAvatar');
					}
				}).catch((error) => {
					console.log(error.message);
				});
		}
	});
	App.router.navigate('/register');
};
