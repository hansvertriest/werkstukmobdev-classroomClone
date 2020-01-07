/* eslint-disable no-restricted-globals */
import App from './App';

export default class Crew {
	constructor(crewCode) {
		this.crewCode = crewCode;
		App.localStorage.setItem('crewCode', crewCode);
	}

	async loadMembers() {
		const crewDoc = await App.firebase.getQuery(['crews', this.crewCode], ['members']).get();
		this.members = {};
		crewDoc.forEach((doc) => {
			const userId = doc.id;
			this.members[userId] = {
				lon: doc.data().lon,
				lat: doc.data().lat,
			};
		});
	}

	async loadSettings() {
		const crewDoc = await App.firebase.getQuery(['crews', this.crewCode]).get();
		const { gameSettings } = crewDoc.data();
		this.gameSettings = gameSettings;
	}

	async loadTaggers() {
		const crewDoc = await App.firebase.getQuery(['crews', this.crewCode]).get();
		const { taggers, previousTaggers } = crewDoc.data();
		this.taggers = taggers;
		this.previousTaggers = previousTaggers;
	}

	setSettings(duration, radius, gameMode) {
		this.gameSettings.duration = (!isNaN(duration)) ? duration : this.gameSettings.duration;
		this.gameSettings.radius = (!isNaN(radius)) ? radius : this.gameSettings.radius;
		this.gameSettings.gameMode = (typeof gameMode === 'string') ? gameMode : this.gameSettings.gameMode;
	}

	getSettings() {
		return this.gameSettings;
	}

	getMemberIds() {
		return Object.keys(this.members);
	}

	getMembers() {
		return this.members;
	}

	getTaggers() {
		return this.taggers;
	}

	getPreviousTaggers() {
		return this.previousTaggers;
	}

	isInGame() {
		return this.gameSettings.inGame;
	}

	getStartDate() {
		return this.gameSettings.startDate;
	}

	getDuration() {
		return this.gameSettings.duration;
	}

	async getModerator() {
		const moderatorDoc = await App.firebase.getQuery(['crews', this.crewCode]).get();
		const { moderator } = moderatorDoc.data();
		return moderator;
	}

	async deleteFromDB() {
		// delete all data in members
		const members = await App.firebase.getDocIds(['crews', this.crewCode], ['members']);
		members.forEach(async (member) => {
			await App.firebase.getQuery(['crews', this.crewCode], ['members', member]).delete();
		});
		// delete crewDoc
		await App.firebase.getQuery(['crews', this.crewCode]).delete();
	}

	async assignNewModerator() {
		const members = await this.getMemberIds();
		const randomIndex = Math.floor(Math.random() * members.length);
		await App.firebase.getQuery(['crews', this.crewCode]).update({
			moderator: members[randomIndex],
		});
	}

	assignRandomTagger() {
		const members = this.getMemberIds();
		const { length } = members;
		const randomIndex = Math.floor(Math.random() * length);
		this.taggers = [members[randomIndex]];
	}

	async startGame(centerPoint) {
		// start game locally
		this.gameSettings.inGame = true;
		this.gameSettings.centerPoint = centerPoint;
		this.gameSettings.startDate = new Date();
		this.assignRandomTagger();
		// upload settings
		await App.firebase.getQuery(['crews', this.crewCode]).update({
			gameSettings: this.getSettings(),
			taggers: this.getTaggers(),
		});
	}

	async stopGame() {
		// stop game locally
		this.gameSettings.inGame = false;
		this.taggers = [];
		this.previousTaggers = [];
		// upload settings
		await App.firebase.getQuery(['crews', this.crewCode]).update({
			gameSettings: this.getSettings(),
			taggers: this.getTaggers(),
			previousTaggers: this.getPreviousTaggers(),
		});
	}
}
