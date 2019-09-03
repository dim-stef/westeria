import firebase from 'firebase/app';
import 'firebase/messaging';

export const initializeFirebase = () =>{

    var firebaseConfig = {
        apiKey: "AIzaSyA7RMz2Y-7PBSlsH6aB-w9WrZFP-rLAnIk",
        authDomain: "subranch-f7044.firebaseapp.com",
        databaseURL: "https://subranch-f7044.firebaseio.com",
        projectId: "subranch-f7044",
        storageBucket: "",
        messagingSenderId: "807145779776",
        appId: "1:807145779776:web:a2df815b5496d81d"
    };

    firebase.initializeApp(firebaseConfig);

    navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      firebase.messaging().useServiceWorker(registration);
    });
}

