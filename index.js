// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';


// Add the Firebase products and methods that you want to use
import {getAuth, EmailAuthProvider, signOut, onAuthStateChanged} from 'firebase/auth';
import {getFirestore, addDoc, collection, query, orderBy, onSnapshot, doc, setDoc, where} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {
    apiKey: "AIzaSyB21xzbxlVKmNBEbCRC6_oE_08NnWX5zbg",
    authDomain: "msterling2-de856.firebaseapp.com",
    projectId: "msterling2-de856",
    storageBucket: "msterling2-de856.appspot.com",
    messagingSenderId: "378421668453",
    appId: "1:378421668453:web:9b2d2e69931a564a72748c",
    measurementId: "G-L0QMG5XLL7"
  };

  // initializeApp(firebaseConfig);
  initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();
  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };
  // Initialize the FirebaseUI widget using Firebase
  const ui = new firebaseui.auth.AuthUI(auth);
  //Listen to RSVP button click
  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      //user is signed in; allows user to sign out
      signOut(auth)
    } else {
      //no user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });
  //listen to the current Auth State
  onAuthStateChanged(auth, user =>{
    if (user) {
      startRsvpButton.textContent = 'LOGOUT'
      //show guestbook when logged in
      guestbookContainer.style.display = 'block';
      //Subscribe to the guestbook collection
      subscribeGuestBook(); 
    } else {
      startRsvpButton.textContent = 'RSVP'
      //hide guestbook when not logged in
      guestbookContainer.style.display = 'none';
      //Unsubscribe from the guestbook collection
      unsubscribeGuestbook();
    }
  });
  //listen to the form submission
  form.addEventListener('submit', async e => {
    e.preventDefault();
    //Write a new message to the database collection "guestbook"
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid
    });
    //clear message input field
    input.value = '';
    //Return false to avoid redirect
    return false;
  });
  //Listen to RSVP response
  rsvpYes.onClick = async () => {
    //Get reference to user's document in attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);
    try {
      await setDoc(userRef, {
        attending: true
      });
    } catch (e) {
      console.error(e);
    }
  };
  rsvpNo.onClick = async () => {
    const userRef = doc(db, 'attendees', auth.currentUser.uid);
    try {
      await setDoc(userRef, {
        attending: false
      });
    } catch (e) {
      console.error(e);
    }
  };
}
main();

//Create query for messages
//Listen to guestbook updates
function subscribeGuestBook() {
  const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
  onSnapshot(q, snaps => {
    //Reset page
    guestbook.innerHTML = '';
    //loop through documents in database
    snaps.forEach(doc => {
      console.log('loop')
      //create an HTML entry for each document and add it to the chat
      const entry = document.createElement('p');
      entry.textContent = doc.data().name + ': ' + doc.data().text;
      guestbook.appendChild(entry);
    });
  });
}
//Unsubscribe from guestbook updates
function unsubscribeGuestbook() {
  if (guestbookListener != null) {
    guestbookListener();
    guestbookListener = null;
  }
}