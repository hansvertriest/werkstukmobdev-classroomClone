import App from './App';
import Crew from './Crew';
import Notifications from './Notifications';

class Player {
	register(userId, screenName, avatar = 'astro1') {
		// store in object
		this.userId = userId;
		this.screenName = screenName;
		this.avatar = avatar;
		this.timesOutOfRange = 0;
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
			simulating: false,
			gameSettings: {
				inGame: false,
				duration: 10,
				startDate: new Date(),
				centerPoint: {
					lon: 3.727280,
					lat: 51.039740,
				},
				gameMode: 'parasite',
				radius: 100,
			},
			taggers: [],
			previousTaggers: [],
			tagRequest: '',
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
		await this.crew.loadMembers();
		const members = this.crew.getMemberIds();
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

	// Source: GeoDataSource.com
	checkDistance(lon1, lat1, lon2, lat2) {
		if ((lat1 === lat2) && (lon1 === lon2)) {
			return 0;
		} else {
			const radlat1 = (Math.PI * lat1) / 180;
			const radlat2 = (Math.PI * lat2) / 180;
			const theta = lon1 - lon2;
			const radtheta = (Math.PI * theta) / 180;
			// eslint-disable-next-line max-len
			let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
			if (dist > 1) {
				dist = 1;
			}
			dist = Math.acos(dist);
			dist = (dist * 180) / Math.PI;
			dist = dist * 60 * 1.1515;
			dist *= 1.609344;
			return dist;
		}
	}

	/**
	 * @description returns an object containing tagger and distance
	 */
	getDistanceToTaggers() { // check the distance to the tagger
		const taggers = this.crew.getTaggers();
		let closestTaggerId;
		let closestDistance;
		taggers.forEach((tagger) => {
			const taggerObj = this.crew.getMembers()[tagger];
			const distance = this.checkDistance(taggerObj.lon, taggerObj.lat, this.getLocation().lon, this.getLocation().lat);
			if (closestTaggerId === undefined || closestDistance > distance) {
				closestTaggerId = tagger;
				closestDistance = distance;
			}
		});
		return {
			userId: closestTaggerId,
			distance: closestDistance,
		};
	}

	/**
	 * @description returns an object containing memberId and distance
	 */
	getDistanceToMembers() {
		const members = this.crew.getMembers();
		const memberIds = this.crew.getMemberIds().filter((memberId) => memberId !== this.getUserId());
		let closestMemberId;
		let closestDistance;
		memberIds.forEach((memberId) => {
			const member = members[memberId];
			const distance = this.checkDistance(member.lon, member.lat, this.getLocation().lon, this.getLocation().lat);
			if (closestMemberId === undefined || closestDistance > distance) {
				closestMemberId = memberId;
				closestDistance = distance;
			}
		});
		return {
			userId: closestMemberId,
			distance: closestDistance,
		};
	}

	async checkIfTagged() {
		const taggerObj = this.getDistanceToTaggers();
		if (taggerObj.distance < 0.01) {
			// TODO implement not tagging back
			await this.crew.setTagRequest(this.getUserId());
			// await this.crew.changeTaggersTo([this.getUserId()]);
		}
	}

	async checkIfPlayerHasTagged() {
		const member = this.getDistanceToMembers();
		if (member.distance < 0.01 && !this.crew.getPreviousTaggers().includes(member.userId)) {
			console.log(member);
			await this.crew.setTagRequest(member.userId);
		}
	}

	async checkIfOutOfZone() {
		// get distance
		const { centerPoint } = this.crew.getSettings();
		const distance = this.checkDistance(this.getLocation().lon, this.getLocation().lat, centerPoint[0], centerPoint[1]);
		const maxTimesOutOfZone = (this.crew.isSimulating()) ? 5 : 100;
		if (distance > this.crew.getSettings().radius / 1000) {
			if (Notifications.getPermission()) {
				Notifications.sentNotification('Get back into the contamination zone!');
			}
			this.timesOutOfRange++;
			if (this.timeOutOfRange > maxTimesOutOfZone) {
				return true;
			}
		}
		return false;
	}

	async getLocationFromGps() {
		return new Promise((resolve, reject) => {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						this.locationAccuracy = position.coords.accuracy;
						resolve({
							coords: {
								longitude: position.coords.longitude,
								latitude: position.coords.latitude,
							},
						});
					},
					(error) => {
						reject(error);
					},
					{
						// enableHighAccuracy: true,
						timeout: 10000,
					},
				);
			} else {
				reject();
			}
		});
	}

	async updateLocation(position) {
		// locally
		this.crew.members[this.getUserId()].location = { lon: position.coords.longitude, lat: position.coords.latitude };
		if (this.lastLocationUpdateTime === undefined) {
			this.lastLocationUpdateTime = new Date();
		}
		// check tagger distance
		if (this.isTagger()) {
			this.checkIfPlayerHasTagged();
		}
		const now = new Date();
		if (Math.abs(this.lastLocationUpdateTime - now) >= 1000 || this.lastLocationUpdateTime === undefined) {
			await App.firebase.getQuery(['crews', this.getCrewCode()], ['members', this.getUserId()]).update({
				lon: position.coords.longitude,
				lat: position.coords.latitude,
			});
		}
		this.lastLocationUpdateTime = now;
	}

	updateLocationLocally(lon, lat) {
		// locally
		this.crew.members[this.getUserId()].location = { lon, lat };
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

	getLocation() {
		const members = this.crew.getMembers();
		return members[this.getUserId()].location;
	}

	crewExists() {
		if (this.crew === undefined) {
			return false;
		}
		return true;
	}

	isTagger() {
		const taggers = this.crew.getTaggers();
		if (taggers.includes(this.getUserId())) {
			return true;
		}
		return false;
	}

	async isModerator() {
		return (this.getUserId() === await this.crew.getModerator());
	}
}

export default new Player();
