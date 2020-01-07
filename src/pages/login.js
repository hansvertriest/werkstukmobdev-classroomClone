import App from '../lib/App';
import listener from '../lib/Listener';

const loginTemplate = require('../templates/login.hbs');

export default async () => {
	/* DOM variables	*/
	const emailFieldId = 'emailField';
	const passwordFieldId = 'passwordField';
	const submitBtnId = 'submitBtn';
	const googleBtnId = 'googleBtn';
	const errorContainerId = 'errorContainer';

	App.render(loginTemplate({
		emailFieldId,
		passwordFieldId,
		submitBtnId,
		googleBtnId,
		errorContainerId,
	}));

	/* Event listeners */
	// login
	listener.onClick(submitBtnId, () => {
		const email = document.getElementById(emailFieldId).value;
		const password = document.getElementById(passwordFieldId).value;
		App._firebase.getAuth().signInWithEmailAndPassword(email, password)
			.then(async () => {
				const user = await App.firebase.getAuth().getCurrentUser;
				if (user) {
					App.router.navigate('/home');
				}
			})
			.catch((error) => {
				console.log(error.message);
				document.getElementById(errorContainerId).innerText = error.message;
			});
	});

	// google btn
	listener.onClick(googleBtnId, () => {
		App._firebase.getAuth().signInWithPopup(App._firebase.getProvider())
			.then((user) => {
				if (user) {
					App.router.navigate('/home');
				}
			}).catch((error) => {
				console.log(error.message);
				document.getElementById(errorContainerId).innerText = error.message;
			});
	});
	App.router.navigate('/login');
};
