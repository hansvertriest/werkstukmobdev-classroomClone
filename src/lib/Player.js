import App from './App';
import Crew from './Crew';

class Player {
	register(userId, screenName, avatar = 'astro1') {
		// store in object
		this.userId = userId;
		this.screenName = screenName;
		this.avatar = avatar;
		// store in local
		App.localStorage.setItem('screenName', screenName);
		App.localStorage.setItem('avatar', avatar);
		App.localStorage.setItem('userId', userId);
		// upload player data
		App.firebase.getQuery(['users', userId]).set({
			screenName,
			crewCode: '',
			avatar,
		});
	}

	registerAvatar(avatar) {
		// upload player data
		App.firebase.getQuery(['users', this.getUserId()]).update({
			avatar,
		});
		// save in storage
		App.localStorage.setItem('avatar', avatar);
		// save in object
		this.avatar = avatar;
	}

	logOut() {
		// delete data locally
		App.localStorage.removeItem('screenName');
		App.localStorage.removeItem('avatar');
		App.localStorage.removeItem('userId');
	}

	/**
	 * @description loads the current user from the db if it's not loaded
	 * param force enables if user should be loaded regardless of suer is already loaded.
	 * @param {*} force ignores if there's already a user in storage
	 */
	async load(userId, force = false) {
		if (!App.localStorage.exists('avatar') && !App.localStorage.exists('screenName') && !App.localStorage.exists('userId')) {
			// get data
			const doc = await App.firebase.getQuery(['users', userId]).get();
			const { screenName, avatar, crewCode } = doc.data();
			// load in storage
			App.localStorage.setItem('screenName', screenName);
			App.localStorage.setItem('avatar', avatar);
			App.localStorage.setItem('userId', userId);
			if (crewCode !== '' && !this.crewExists()) {
				await this.joinCrew(crewCode);
			} else if (this.crewExists()) {
				await this.joinCrew(App.localStorage.getItem('crewCode'));
			}
		} else if (force) {
			// get data
			const doc = await App.firebase.getQuery(['users', userId]).get();
			const { screenName, avatar, crewCode } = doc.data();
			// load in storage
			App.localStorage.setItem('screenName', screenName);
			App.localStorage.setItem('avatar', avatar);
			App.localStorage.setItem('userId', userId);
			if (crewCode !== '') {
				await this.joinCrew(crewCode);
			}
		}
	}

	/*
		crew methods
	*/

	async joinCrew(crewCode) {
		// check if crew exists
		const crews = await App.firebase.getDocIds(['crews']);
		if (crews.includes(crewCode)) {
			// leaveCrew if player is already in one
			if (this.crewExists()) {
				await this.leaveCrew();
			}

			// join locally
			this.crew = new Crew(crewCode);

			// join in the cloud
			await App.firebase.getQuery(['crews', crewCode], ['members', this.getUserId()]).set({
				lon: 0,
				lat: 0,
			});
			await App.firebase.getQuery(['users', this.getUserId()]).update({
				crewCode,
			});

			// load in crew elements
			await this.crew.loadMembers();
			await this.crew.loadSettings();
			await this.crew.loadTaggers();
		}
	}

	/**
	 * @description initializes the crew in the db
	 */
	async initCrew(crewCode) {
		await App.firebase.getQuery(['crews', crewCode]).set({
			gameSettings: {
				inGame: false,
				duration: 10,
				startData: new Date(),
				centerPoint: {
					lon: 3.727280,
					lat: 51.039740,
				},
				gameMode: 'parasite',
				radius: 100,
			},
			taggers: [],
			previousTaggers: [],
			moderator: this.getUserId(),
		});
	}

	async createCrew() {
		// generate a code
		const crewCode = await this.generateCrewCode();
		// init the crew in the DB
		await this.initCrew(crewCode);
		// join the crew
		await this.joinCrew(crewCode);
	}

	async generateCrewCode() {
		// Get all existing crewCodes
		let crewCode;
		const crewCodesDoc = await App.firebase.getQuery(['crews']).get();
		const crewCodes = [];
		crewCodesDoc.forEach((crew) => {
			crewCodes.push(crew.id);
		});
		// Generate codes while no unique code has ben generated
		do {
			crewCode = Math.floor((Math.random() * 8999) + 1000).toString();
		} while (crewCodes.includes(crewCode));
		return crewCode;
	}

	async leaveCrew() {
		// check if player is last one and if he is moderator
		const members = await this.crew.getMemberIds();
		if (members[1] === undefined) {
			await this.crew.deleteFromDB();
		} else if (await this.crew.getModerator() === this.getUserId()) {
			await this.crew.assignNewModerator();
			// delete out of crew
			await App.firebase.getQuery(['crews', this.getCrewCode()], ['members', this.getUserId()]).delete();
		} else {
			// delete out of crew
			await App.firebase.getQuery(['crews', this.getCrewCode()], ['members', this.getUserId()]).delete();
		}
		// delete crewCode out of db
		await App.firebase.getQuery(['users', this.getUserId()]).update({
			crewCode: '',
		});
		// delete crewCode in localstorage
		App.localStorage.removeItem('crewCode');
		// delete crewObject
		this.crew = undefined;
	}

	async getLocation() {
		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					this.locationAccuracy = position.coords.accuracy;
					resolve({
						lon: position.coords.longitude,
						lat: position.coords.latitude,
					});
				},
				() => {
					reject();
				},
				{
					enableHighAccuracy: true,
				},
			);
		});
	}

	/*
		get Player data
	*/

	getUserId() {
		if (this.userId !== undefined) {
			return this.userId;
		}
		return App.localStorage.getItem('userId');
	}

	getAvatar() {
		if (this.avatar !== undefined) {
			return this.avatar;
		}
		return App.localStorage.getItem('avatar');
	}

	getScreenName() {
		if (this.screenName !== undefined) {
			return this.screenName;
		}
		return App.localStorage.getItem('screenName');
	}

	getCrewCode() {
		if (this.crew.crewCode !== undefined) {
			return this.crew.crewCode;
		}
		return App.localStorage.getItem('crewCode');
	}

	crewExists() {
		if (this.crew === undefined) {
			return false;
		}
		return true;
	}
}

export default new Player();
