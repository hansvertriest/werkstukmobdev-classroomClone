import App from './App';

class Page {
	constructor() {
		this.currentPage = '';
		this.lastPage = '';
	}

	goTo(pageName) {
		if (this.lastPage === '') {
			this.lastPage = pageName;
		} else {
			this.lastPage = this.currentPage;
		}
		this.currentPage = pageName;
		App.router.navigate(`/${pageName}`);
	}

	goToLastPage() {
		if (this.lastPage === '') {
			this.goTo('home');
		} else if (this.lastPage === 'connectionLost') {
			this.goTo('game');
		} else {
			this.goTo(this.lastPage);
		}
	}

	changeInnerText(elementId, innerText) {
		document.getElementById(elementId).innerText = innerText;
	}
}

export default new Page();
