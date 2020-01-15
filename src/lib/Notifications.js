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
		Notification.requestPermission((result) => {
			if (result === 'granted') {
				navigator.serviceWorker.ready.then((registration) => {
					registration.showNotification(text);
				});
			}
		});
	}
}

export default new Notifications();
