import App from '../lib/App';
import Page from '../lib/Page';
import Listener from '../lib/Listener';
import Player from '../lib/Player';
import Mapbox from '../lib/core/MapBox';

const gameTemplate = require('../templates/game.hbs');

export default async () => {
	/* Dom variables */
	const buttonMsgId = 'buttonMsg';
	const buttonCrewId = 'buttonCrew';
	const buttonSettingsId = 'buttonSettings';
	const mapId = 'map';
	const timerId = 'timer';

	App.render(gameTemplate({
		isModerator: (Player.crew.getModerator() === Player.getUserId()),
		isNotTagger: (!Player.crew.getTaggers().includes(Player.getUserId())),
		buttonMsgId,
		buttonCrewId,
		buttonSettingsId,
		mapId,
		timerId,
	}));
	App.router.navigate('/game');


	// set timer
	const timerInterval = setInterval(async () => {
		const now = new Date().getTime() / 1000;
		const difference = Math.floor(now - Player.crew.getStartDate().seconds);
		const differenceMinutes = Math.floor(difference / 60);
		const differenceSeconds = (difference - differenceMinutes * 60);
		let minutesLeft = Player.crew.getDuration() - differenceMinutes;
		let secondsLeft = 60 - differenceSeconds;
		if (secondsLeft === 60) {
			secondsLeft = '00';
		} else if (secondsLeft !== 0) {
			minutesLeft -= 1;
		}
		if (minutesLeft < 0) {
			// stop game
			await Player.crew.stopGame();
			clearInterval(timerInterval);
		}
		Page.changeInnerText(timerId, `${minutesLeft}:${secondsLeft}`);
	}, 1000);


	// init map
	const map = new Mapbox('pk.eyJ1IjoicGltcGFtcG9taWtiZW5zdG9tIiwiYSI6ImNqdmM1a3dibjFmOHE0NG1qcG9wcHdmNnIifQ.ZwK_kkHHAYRTbnQvD7oVBw');

	// set map points
	map.getMap().on('load', async () => {
		// listen for locations and set points
		const locationQuery = App.firebase.getQuery(['crews', Player.getCrewCode()], ['members']);
		const locationListener = Listener.onSnapshot(locationQuery, (docs) => {
			// get all member documents
			const members = docs.docs.map((member) => ({
				userId: member.id,
				data: member.data(),
			}));

			const localStoredMembers = Player.crew.getMembers();
			const localStoredMemberIds = Player.crew.getMemberIds();
			const memberLayers = map.getMemberLayers(localStoredMemberIds);
			console.log(memberLayers);
			// check if member has moved
			members.forEach(async (member) => {
				// if member is not found locally, reload members
				if (!localStoredMemberIds.includes(member.userId)) {
					await Player.crew.loadMembers();
				} else if (localStoredMembers[member.userId].lon !== member.data.lon || localStoredMembers[member.userId].lat !== member.data.lat) {
					// check if the map already contains this members point
					if (!memberLayers.includes(member.userId)) {
						map.addPoint(member.userId, {
							type: 'Point',
							coordinates: [member.data.lon, member.data.lat],
						});
					} else {
						map.changeData(member.userId, {
							type: 'Point',
							coordinates: [member.data.lon, member.data.lat],
						});
					}
					map.goToCoords(member.data.lon, member.data.lat);
					console.log(`${member.userId}: point has hanged!`);
				} else {
					// do nothing
					console.log(`${member.userId}: point did not change!`);
				}
			});
		});
	});

	// listen for game end and change in tagger

	// listen to gps
};
