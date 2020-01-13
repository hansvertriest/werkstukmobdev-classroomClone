import App from '../lib/App';
import Listener from '../lib/Listener';
import Player from '../lib/Player';

const registerAvatarTemplate = require('../templates/registerAvatar.hbs');

export default () => {
	/* Page data */
	const avatars = ['astro1', 'astro2'];
	let avatarIndex = 0;

	/* DOM variables	*/
	let avatar = `../assets/images/avatar/${avatars[avatarIndex]}_128.png`;
	const chooseBtnId = 'chooseBtn';
	const goLeftBtnId = 'goLeftBtn';
	const goRightBtnId = 'geRightBtn';

	App.render(registerAvatarTemplate({
		avatar,
		chooseBtnId,
		goLeftBtnId,
		goRightBtnId,
	}));
	App.router.navigate('/registerAvatar');

	/* Event listeners */

	Listener.onClick(goLeftBtnId, () => {
		avatarIndex = (avatarIndex === 0) ? avatars.length - 1 : avatarIndex - 1;
		avatar = avatars[avatarIndex];
		document.getElementById('avatarDiv').style.backgroundImage = `../assets/images/avatar/${avatar}_128.png`;
	});

	Listener.onClick(goRightBtnId, () => {
		avatarIndex = (avatarIndex + 1 === avatars.length) ? 0 : avatarIndex + 1;
		avatar = avatars[avatarIndex];
		document.getElementById('avatarDiv').style.backgroundImage = `../assets/images/avatar/${avatar}_128.png`;
	});

	// Register avatar
	Listener.onClick(chooseBtnId, () => {
		// Add to database
		Player.registerAvatar(avatar);
		App.router.navigate('/home');
	});
	App.router.navigate('/registerAvatar');
};
