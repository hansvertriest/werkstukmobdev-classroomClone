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

	// Deprecated because this removes the ability to unsubscribe from listener
	// onSnapshot(query, callback) {
	// 	query.onSnapshot(callback);
	// }
}
export default new EventController();
