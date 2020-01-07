/**
 * A FireBase Wrapper
 * docs: https://firebase.google.com/docs
 *
 * @author Tim De Paepe <tim.depaepe@arteveldehs.be>
 */

import * as firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

class FireBase {
	constructor(apiKey, projectId, messagingSenderId) {
		this.apiKey = apiKey;
		this.projectId = projectId;
		this.messagingSenderId = messagingSenderId;
		this.initializeApp();
		this.db = this.getFirestore();
	}

	initializeApp() {
		firebase.initializeApp(this.getFireBaseConfig());
	}

	getFireBaseConfig() {
		return {
			apiKey: `${this.apiKey}`,
			authDomain: `${this.projectId}.firebaseapp.com`,
			databaseURL: `https://${this.projectId}.firebaseio.com`,
			projectId: `${this.projectId}`,
			storageBucket: `${this.projectId}.appspot.com`,
			messagingSenderId: `${this.messagingSenderId}`,
		};
	}

	getFirestore() {
		return firebase.firestore();
	}

	getAuth() {
		return firebase.auth();
	}

	getProvider() {
		return new firebase.auth.GoogleAuthProvider();
	}

	getQuery(docOne, docTwo, docThree) {
		if (docTwo === undefined && docThree === undefined) {
			if (docOne[1] === undefined) {
				return this.db.collection(docOne[0]);
			} else {
				return this.db.collection(docOne[0]).doc(docOne[1]);
			}
		} else if (docThree === undefined) {
			if (docTwo[1] === undefined) {
				return this.db.collection(docOne[0]).doc(docOne[1]).collection(docTwo[0]);
			} else {
				return this.db.collection(docOne[0]).doc(docOne[1]).collection(docTwo[0]).doc(docTwo[1]);
			}
		}
		if (docThree[1] === undefined) {
			return this.db.collection(docOne[0]).doc(docOne[1]).collection(docTwo[0]).doc(docTwo[1])
				.collection(docThree[0]);
		}
		return this.db.collection(docOne[0]).doc(docOne[1]).collection(docTwo[0]).doc(docTwo[1])
			.collection(docThree[0])
			.doc(docThree[1]);
	}

	async getDocIds(docOne, docTwo) {
		let query;
		if (docTwo === undefined) {
			query = this.db.collection(docOne[0]);
		} else {
			query = this.db.collection(docOne[0]).doc(docOne[1]).collection(docTwo[0]);
		}
		const docs = await query.get();

		return docs.docs.map((document) => document.id);
	}
}

export default FireBase;
