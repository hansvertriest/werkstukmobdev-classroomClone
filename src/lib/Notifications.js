class Notifications {
	getPermission() {
		return new Promise((resolve, reject) => {
			Notification.requestPermission()
				.then((result) => {
					if (result === 'granted') {
						resolve(true);
					} else {
						resolve(false);
					}
				});
		});
	}

	sentNotification(text) {
		const img = '../../assets/images/avatar/astro1_64.png';
		const notification = new Notification('To do list', { body: text, icon: img });
	}
}

export default new Notifications();
