import App from './App';
import walkingCoordinates from '../assets/dataseeder/route1';

class Backend {
	constructor() {
		this.crewCode = '';
		this.screenNames = ['AlienDestroyer', 'CaféZuiper', 'KlokjesJanine', 'SimpleJohn', 'Zatlap3000'];
		this.avatars = ['astro1', 'astro2'];
		this.listeners = [];
		this.gameMode = 'parasite';
		this.tagRadius = 0.05;
		this.tagColor = '#ebbd34';
		this.normalColor = '#0e7bb5';
		this.oldTagger = [];
	}

	setCrewCode(backCrewCode) {
		this.backCrewCode = backCrewCode;
		App.localStorage.setItem('backCrewCode', backCrewCode);
	}

	getCrewCode() {
		if (this.backCrewCode !== undefined) {
			return this.backCrewCode;
		}
		return App.localStorage.getItem('backCrewCode');
	}

	/**
	 * @description returns an array of userObjects with their userId, avatar and screenName.
	 * @param {*} crewCode
	 */
	async getCrewMembers(crewCode) {
		// get documents of all members
		const memberDocs = await App.firebase.getQuery(['crews', crewCode], ['members']).get();
		// fill crewMembers with userObjects
		const crewMembers = [];
		await new Promise((resolve) => {
			memberDocs.forEach(async (member) => {
				const userDoc = await App.firebase.getQuery(['users', member.id]).get();
				const userInfo = userDoc.data();
				crewMembers.push({
					userId: userDoc.id,
					screenName: userInfo.screenName,
					avatar: userInfo.avatar,
				});
				if (crewMembers.length === memberDocs.docs.length) {
					resolve();
				}
			});
		});
		return crewMembers;
	}

	async generateRandomUser(crewCode) {
		let userId;
		// Get all existing users
		const userIds = await this.getExistingUsers();
		// Generate ids while no unique ids has ben generated
		await new Promise((resolve) => {
			do {
				userId = Math.floor((Math.random() * 89999999) + 1000);
				if (!userIds.includes(userId)) {
					resolve();
				}
			} while (userIds.includes(userId));
		});
		userId = `fict-${userId}`.toString();
		// choose random avatar
		const avatar = this.avatars[Math.floor(Math.random() * this.avatars.length)];
		// choose random screenName
		const screenName = this.screenNames[Math.floor(Math.random() * this.screenNames.length)];
		// Upload member
		await App.firebase.getQuery(['users', userId]).set({
			avatar,
			crewCode: '',
			screenName,
		});
		this.joinUserToCrew(userId, crewCode);
	}

	/**
	 * @description Fetches all existing userId's (array)
	 */
	async getExistingUsers() {
		// Get all existing users
		const userIdsDoc = await App.firebase.getQuery(['users']).get();
		const userIds = [];
		userIdsDoc.forEach((user) => {
			userIds.push(user.id);
		});
		return userIds;
	}

	/**
	 * @description joins a specified user to a specified crew
	 * @param userId
	 * @param crewCode
	 */
	async joinUserToCrew(userId, crewCode) {
		// first check if user exists
		const userDoc = await App.firebase.getQuery(['users', userId]).get();
		if (userDoc.exists) {
			await App.firebase.getQuery(['crews', crewCode], ['members', userId]).set({
				lon: 0,
				lat: 0,
			});
		}
		await App.firebase.getQuery(['users', userId]).update({
			crewCode,
		});
	}

	async deleteUserFromCrew(crewCode, userId) {
		// delete user crew code
		await App.firebase.getQuery(['users', userId]).update({
			crewCode: '',
		});

		// delete userId in crewMembers
		const crewDoc = await App.firebase.getQuery(['crews', crewCode], [userId]).delete();

		// change captain
		const moderator = await App.firebase.getQuery(['crews', crewCode]).get().data().moderator;
		if (moderator === userId) {
			await this.assignNewModerator(crewCode);
		}
	}

	/**
	 * @description assigns a new, random moderator to the crew
	 * @param {*} crewCode
	 */
	async assignNewModerator(crewCode) {
		const crewDoc = await App.firebase.db.collection('crews').doc(crewCode).get();
		const crew = crewDoc.data().members;
		if (crew.length > 0) {
			const randomIndex = Math.floor(Math.random() * crew.length);
			await App.firebase.getQuery(['crews', crewCode]).update({
				moderator: crew[randomIndex],
			});
		} else {
			await App.firebase.getQuery(['crews', crewCode]).delete();
			await App.firebase.getQuery(['crews', crewCode], ['members']).delete();
		}
	}

	/*
		DATASEEDER
	*/

	async changeLocationOfCrewMember(member, routeNumber, step) {
		await App.firebase.db.collection('crews').doc(this.getCrewCode()).collection('members').doc(member)
			.set({
				lon: walkingCoordinates.routes[routeNumber][step][0],
				lat: walkingCoordinates.routes[routeNumber][step][1],
			});
	}

	async simulateGame() {
		let step = 0;
		const interval = setInterval(async () => {
			// get crewMemberIds
			const backCrewCode = this.getCrewCode();
			console.log(this.getCrewCode());
			const members = await App.firebase.getDocIds(['crews', backCrewCode], ['members']);
			// set init location of members
			if (step === 0) {
				this.changeLocationOfCrewMember(members[0], 0, 0);
				this.changeLocationOfCrewMember(members[1], 1, 0);
			}
			// let first member tag second member
			if (step <= 27) {
				this.changeLocationOfCrewMember(members[0], 0, step);
			}
			if (step <= 73 && step > 26) {
				this.changeLocationOfCrewMember(members[1], 1, step - 26);
			}
			console.log('updated location in db');

			// check for step limit
			if (step === 73) {
				clearInterval(interval);
			}
			// update stepNumber
			step++;
		}, 500);
	}
}

export default new Backend();
