// import pages
import Backcrewlist from './pages/backCrewList';
import Createinvite from './pages/createInvite';
import Createoverview from './pages/createOverview';
import Createsettings from './pages/createSettings';
import Crewoverview from './pages/crewOverview';
import Game from './pages/game';
import Gamestart from './pages/gameStart';
import Home from './pages/home';
import Infected from './pages/infected';
import Join from './pages/join';
import Login from './pages/login';
import Newpassword from './pages/newPassword';
import Passwordsent from './pages/passwordSent';
import Register from './pages/register';
import Registeravatar from './pages/registerAvatar';
import Backcrewdetail from './pages/backCrewDetail';
import Connectionlost from './pages/connectionLost';
import Taggedparasite from './pages/taggedParasite';
import Taggedconfirm from './pages/taggedConfirm';
import Parasitewin from './pages/parasiteWin';
import Parasitelose from './pages/parasiteLose';
import Offline from './pages/offline';

export default [
	{ path: '/backCrewList', view: Backcrewlist },
	{ path: '/createInvite', view: Createinvite },
	{ path: '/createOverview', view: Createoverview },
	{ path: '/createSettings', view: Createsettings },
	{ path: '/crewOverview', view: Crewoverview },
	{ path: '/game', view: Game },
	{ path: '/gameStart', view: Gamestart },
	{ path: '/home', view: Home },
	{ path: '/infected', view: Infected },
	{ path: '/join', view: Join },
	{ path: '/login', view: Login },
	{ path: '/newPassword', view: Newpassword },
	{ path: '/passwordSent', view: Passwordsent },
	{ path: '/register', view: Register },
	{ path: '/backCrewDetail', view: Backcrewdetail },
	{ path: '/connectionLost', view: Connectionlost },
	{ path: '/taggedParasite', view: Taggedparasite },
	{ path: '/taggedConfirm', view: Taggedconfirm },
	{ path: '/parasiteWin', view: Parasitewin },
	{ path: '/parasiteLose', view: Parasitelose },
	{ path: '/offline', view: Offline },
	{ path: '/registerAvatar', view: Registeravatar },
];
