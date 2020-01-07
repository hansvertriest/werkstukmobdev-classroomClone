import App from './App';

class Page {
	constructor() {
		this.currentPage = '';
	}

	goTo(pageName) {
		this.lastPage = this.currentPage;
		this.currentPage = pageName;
		App.router.navigate(`/${pageName}`);
		console.log(this.currentPage);
	}

	changeInnerText(elementId, innerText) {
		document.getElementById(elementId).innerText = innerText;
	}
}

export default new Page();
