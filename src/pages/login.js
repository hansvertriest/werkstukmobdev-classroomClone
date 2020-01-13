import App from '../lib/App';
import listener from '../lib/Listener';
import Player from '../lib/Player';

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
				const userId = await App.firebase.getAuth().currentUser.uid;
				const userIds = await App.firebase.getDocIds(['users']);
				if (userIds.includes(userId)) {
					App.router.navigate('/home');
				}
			})
			.catch((error) => {
				document.getElementById(errorContainerId).innerText = error.message;
			});
	});

	// google btn
	listener.onClick(googleBtnId, () => {
		App._firebase.getAuth().signInWithPopup(App._firebase.getProvider())
			.then(async () => {
				const userId = await App.firebase.getAuth().currentUser.uid;
				const userIds = await App.firebase.getDocIds(['users']);
				if (userIds.includes(userId)) {
					App.router.navigate('/home');
				} else {
					document.getElementById(errorContainerId).innerText = 'No user found with such credentials!';
				}
			}).catch((error) => {
				document.getElementById(errorContainerId).innerText = error.message;
			});
	});
	App.router.navigate('/login');
};
