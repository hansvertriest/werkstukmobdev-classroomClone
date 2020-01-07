class EventController {
	/*
		event listeners
	*/
	onClick(elementId, callback) {
		return document.getElementById(elementId).addEventListener('click', callback);
	}

	removeClick(elementId) {
		document.getElementById(elementId).removeEventListener('click');
	}

	/*
		firebase onsnapshot
	*/

	onSnapshot(query, callback) {
		return query.onSnapshot(callback);
	}
}
export default new EventController();
