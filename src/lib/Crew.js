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

	async loadGameSettings() {
		const crewDoc = await App.firebase.getQuery(['crews', this.crewCode]).get();
		const { gameSettings } = crewDoc.data();
		this.gameSettings.inGame = gameSettings.inGame;
		this.gameSettings.centerPoint = gameSettings.centerPoint;
		this.gameSettings.startDate = gameSettings.startDate;
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

	setTaggers(taggers) {
		this.taggers = taggers;
	}

	getPreviousTaggers() {
		return this.previousTaggers;
	}

	setPreviousTaggers(previousTagger) {
		this.previousTaggers = previousTagger;
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

	setSimulating(bool) {
		this.simulating = bool;
	}

	isSimulating() {
		return this.simulating;
	}

	async getSimulating() {
		const crewQuery = App.firebase.getQuery(['crews', this.crewCode]);
		const crewDoc = await crewQuery.get();
		const { simulation } = crewDoc.data();
		this.setSimulating(simulation);
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

	async removeTaggers() {
		this.taggers = [];
		await App.firebase.getQuery(['crews', this.crewCode]).update({
			taggers: this.taggers,
		});
	}

	async removeMember(userId) {
		// remove crewcode from userDoc
		await App.firebase.getQuery(['users', userId]).update({
			crewCode: '',
		});
		// remove coordinates
		await App.firebase.getQuery(['crews', this.crewCode], ['members', userId]).delete();
	}

	async addTagger(taggerId) {
		this.taggers.push(taggerId);
		console.log(this.taggers);
		console.log(taggerId);
		await App.firebase.getQuery(['crews', this.crewCode]).update({
			taggers: this.taggers,
		});
	}

	async changeTaggersTo(memberIds) {
		await App.firebase.getQuery(['crews', this.crewCode]).update({
			previousTaggers: this.taggers,
		});
		this.taggers = [];
		memberIds.forEach(async (memberId) => {
			await this.addTagger(memberId);
		});
	}

	async setTagRequest(userId) {
		const crewQuery = App.firebase.getQuery(['crews', this.crewCode]);
		console.log(userId);
		await crewQuery.update({
			tagRequest: userId,
		});
	}

	async removeTagRequest() {
		const crewQuery = App.firebase.getQuery(['crews', this.crewCode]);
		await crewQuery.update({
			tagRequest: '',
		});
	}

	async startGame(centerPoint) {
		// start game locally
		console.log(centerPoint);
		this.gameSettings.inGame = true;
		this.gameSettings.centerPoint = [centerPoint.coords.longitude, centerPoint.coords.latitude];
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
