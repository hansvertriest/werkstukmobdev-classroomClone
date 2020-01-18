import App from '../lib/App';
import Page from '../lib/Page';
import Listener from '../lib/Listener';
import Player from '../lib/Player';
import Mapbox from '../lib/core/MapBox';
import Notifications from '../lib/Notifications';

const gameTemplate = require('../templates/game.hbs');

const unsubscribeListeners = (listenerArray) => {
	listenerArray.forEach((listener) => {
		listener();
	});
};

export default async () => {
	const listeners = [];

	// load game data
	await Player.crew.loadGameSettings();
	await Player.crew.loadTaggers();

	/* Dom variables */
	const isModerator = await Player.isModerator();
	const buttonMsgId = 'buttonMsg';
	const buttonCrewId = 'buttonCrew';
	const buttonSettingsId = 'buttonSettings';
	const mapId = 'map';
	const timerId = 'timer';

	App.render(gameTemplate({
		isModerator,
		isNotModerator: !isModerator,
		isNotTagger: (!Player.crew.getTaggers().includes(Player.getUserId())),
		isTagger: (Player.crew.getTaggers().includes(Player.getUserId())),
		buttonMsgId,
		buttonCrewId,
		buttonSettingsId,
		mapId,
		timerId,
	}));
	App.router.navigate('/game');
	const map = new Mapbox('pk.eyJ1IjoibWlnaHR5YmlpaXkiLCJhIjoiY2s1NDM0NnhrMGRzcTNqb2ZoMXJ2cWNwdyJ9.eQxl50P8hC0WzG7bv7G4CQ');

	// set map points
	let locationListener;
	map.getMap().on('load', async () => {
		// go to a location with streets so player sees the map is laoded
		map.flyToCoords(3.711680, 51.062530);

		// disable loader animation
		document.getElementById('loadingContainer').style.display = 'none';

		// listen for locations and set points
		const locationQuery = App.firebase.getQuery(['crews', Player.getCrewCode()], ['members']);
		locationListener = locationQuery.onSnapshot((docs) => {
			// get all member documents
			const members = docs.docs.map((member) => ({
				userId: member.id,
				data: member.data(),
			}));

			const localStoredMembers = Player.crew.getMembers();
			const localStoredMemberIds = Player.crew.getMemberIds();
			const memberLayers = map.getMemberLayers(localStoredMemberIds);
			// check if member has moved
			members.forEach(async (member) => {
				// if member is not found locally, reload members
				if (!localStoredMemberIds.includes(member.userId)) {
					await Player.crew.loadMembers();

				// check if member = Player (only the members should be displayed as the Player gets displayed in the watchPosition)
				} else if (member.userId !== Player.getUserId()) {
					// check if the data differs from the local data, only changed data should be updated
					if (localStoredMembers[member.userId].lon !== member.data.lon || localStoredMembers[member.userId].lat !== member.data.lat) {
						// update member locally
						Player.crew.members[member.userId].lon = member.data.lon;
						Player.crew.members[member.userId].lat = member.data.lat;

						/*
							Displaying members on map
							Only displays other members, the Player gets displayed in the GPS watcher
						*/

						// check if
						//	member is already displayed
						//	if the Player is the tagger, if not members should not be displayed
						if (!memberLayers.includes(member.userId) && Player.isTagger()) {
							map.addPoint(member.userId, {
								type: 'Point',
								coordinates: [member.data.lon, member.data.lat],
							});
							// set tagger
							map.setPointColor(member.userId);
						} else if (member.userId !== Player.getUserId() && Player.isTagger()) {
							console.log('member');
							map.changeData(member.userId, {
								type: 'Point',
								coordinates: [member.data.lon, member.data.lat],
							});

							// if this point is the players point
							if (member.userId === Player.getUserId()) {
								map.goToCoords(member.data.lon, member.data.lat);
							}
						}
					}
				}
			});
		});

		listeners.push(locationListener);

		// check steps for when in simulate mode
		const memberDoc = App.firebase.getQuery(['crews', Player.getCrewCode()], ['members', Player.getUserId()]);
		const gameListener = memberDoc.onSnapshot(async (doc) => {
			if (Player.crew.isSimulating()) {
				const { lon, lat } = doc.data();

				// update location locally
				Player.updateLocationLocally(lon, lat);

				// check if point is already on the map
				const memberLayers = map.getMemberLayers(Player.crew.getMemberIds());
				if (memberLayers.includes(Player.getUserId())) {
					map.changeData(Player.getUserId(), {
						type: 'Point',
						coordinates: [lon, lat],
					});
				} else {
					map.addPoint(Player.getUserId(), {
						type: 'Point',
						coordinates: [lon, lat],
					});
					// set tagger
					map.setPointColor(Player.getUserId(), true);
				}

				// update color
				if (Player.isTagger()) {
					map.setPointColor(Player.getUserId(), true);
				} else {
					map.setPointColor(Player.getUserId());
				}
				map.goToCoords(lon, lat);

				// check if has tagged
				if (Player.isTagger()) {
					await Player.checkIfPlayerHasTagged();
					Notifications.sentNotification('We sensed you tagged someone!');
				} else {
					const { distance } = Player.getDistanceToTaggers();
					Page.changeInnerText('distance', `${Math.floor(distance * 1000)}m`);
				}
				// check if out of zone
				// const outOfZone = Player.checkIfOutOfZone();
				// if (outOfZone) {
				// 	locationListener();
				// 	await Player.leaveCrew();
				// 	Page.goTo('home');
				// }
				map.goToCoords(lon, lat);
			}
		});

		listeners.push(gameListener);
	});

	// set timer
	const timerInterval = setInterval(async () => {
		const startDate = Player.crew.getStartDate();
		const now = new Date().getTime() / 1000;
		const difference = Math.floor(now - startDate.seconds);
		const differenceMinutes = Math.floor(difference / 60);
		const differenceSeconds = (difference - differenceMinutes * 60);
		let minutesLeft = Player.crew.getDuration() - differenceMinutes;
		let secondsLeft = 60 - differenceSeconds;
		if (secondsLeft === 60) {
			secondsLeft = '00';
		} else if (secondsLeft !== 0) {
			minutesLeft -= 1;
		}
		if (String(secondsLeft).length === 1) {
			secondsLeft = `0${secondsLeft}`;
		}
		if (minutesLeft < 0) {
			// stop game
			unsubscribeListeners(listeners);
			clearInterval(timerInterval);
			await Player.crew.stopGame();
			if (Player.isTagger()) {
				Page.goTo('parasiteLose');
			} else {
				Page.goTo('parasiteWin');
			}
		}
		Page.changeInnerText(timerId, `${minutesLeft}:${secondsLeft}`);
	}, 1000);


	await Player.crew.loadTaggers();

	// listen for game changes
	const crewQuery = App.firebase.getQuery(['crews', Player.getCrewCode()]);
	const crewDocListener = crewQuery.onSnapshot(async (doc) => {
		const {
			gameSettings,
			taggers,
			simulating,
			tagRequest,
			previousTaggers,
		} = doc.data();
		if (!gameSettings.inGame) {
			App.router.navigate('/home');
			clearInterval(timerInterval);

			// unsubscribe listeners
			crewDocListener();
			locationListener();
		}

		const taggersLocal = Player.crew.getTaggers();
		// get change in tagger
		if (!Player.crew.arrayEqualsTaggers(taggers)) {
			Notifications.sentNotification('We sensed you tagged someone!');
			console.log(taggers, taggersLocal);
			Player.crew.setTaggers(taggers);
			clearInterval(timerInterval);
			unsubscribeListeners(listeners);
			if (Player.isTagger()) {
				Page.goTo('gameStart');
			} else {
				Page.goTo('game');
			}
			// // change taggers
			// if (map.getMap().style.loaded()) {
			// 	// remove all points on the map
			// 	const memberLayers = map.getMemberLayers(Player.crew.getMemberIds());
			// 	memberLayers.forEach((member) => {
			// 		map.removePoint(member);
			// 	});
			// }
		}

		// change in gameSettings
		if (gameSettings !== Player.crew.getSettings) {
			Player.crew.setSettings(gameSettings);
		}

		// get change in previousTagger
		if (previousTaggers !== Player.crew.getPreviousTaggers()) {
			Player.crew.setPreviousTaggers(previousTaggers);
		}

		// update if game is simulating
		Player.crew.setSimulating(simulating);

		// check the tag request
		if (tagRequest === Player.getUserId()) {
			unsubscribeListeners(listeners);
			clearInterval(timerInterval);
			Page.goTo('taggedConfirm');
		}
	});


	listeners.push(crewDocListener);

	// listen to gps
	navigator.geolocation.watchPosition(
		async (position) => {
			if (!Player.crew.isSimulating()) {
				// update location locally and in db
				await Player.updateLocation(position);

				// update location on map
				if (map.getMap().style.loaded()) {
					// check if point is already on the map
					const memberLayers = map.getMemberLayers(Player.crew.getMemberIds());
					if (memberLayers.includes(Player.getUserId())) {
						map.changeData(Player.getUserId(), {
							type: 'Point',
							coordinates: [position.coords.longitude, position.coords.latitude],
						});
					} else {
						map.addPoint(Player.getUserId(), {
							type: 'Point',
							coordinates: [position.coords.longitude, position.coords.latitude],
						});
						// set color
						map.setPointColor(Player.getUserId(), true);
					}

					// update color and check if Player has tagged someone
					if (Player.isTagger()) {
						await Player.checkIfPlayerHasTagged();
						map.setPointColor(Player.getUserId(), true);
					} else {
						map.setPointColor(Player.getUserId());
					}

					// check if out of zone
					// const outOfZone = await Player.checkIfOutOfZone();
					// if (outOfZone) {
					// 	locationListener();
					// 	await Player.leaveCrew();
					// 	Page.goTo('home');
					// }
					map.goToCoords(position.coords.longitude, position.coords.latitude);
				}

				// set alien distance
				if (!Player.isTagger()) {
					const { distance } = Player.getDistanceToTaggers();
					Page.changeInnerText('distance', `${Math.floor(distance * 1000)}m`);
				}
			}
		},
		() => {
			console.log('GPS FAILED');
		},
		{
			enableHighAccuracy: true,
		},
	);

	/*
		Event listeners
	*/

	// if moderator add the go to settings listener
	if (isModerator) {
		Listener.onClick(buttonSettingsId, () => {
			unsubscribeListeners(listeners);
			Page.goTo('createOverview');
			clearInterval(timerInterval);
		});
	}

	if (!isModerator) {
		Listener.onClick(buttonCrewId, () => {
			unsubscribeListeners(listeners);
			Page.goTo('crewOverview');
			clearInterval(timerInterval);
		});
	}
};
