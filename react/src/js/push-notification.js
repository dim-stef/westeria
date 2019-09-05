import firebase from 'firebase/app';
import 'firebase/messaging';
import axios from 'axios';

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

    const messaging = firebase.messaging();
    navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
        messaging.useServiceWorker(registration);
    });

    messaging.onMessage(function(payload) {

    });
    
    firebase.messaging().usePublicVapidKey("BE3fUDBmBvJuspuXNcZDriZVdBpET_y3IJQna0vyXK6o1Aoo7FGLj5MiXnmmXUd6tY9b7OLSDjK1jHuYgO4X6UY");

    
}

export const askForPermissionToReceiveNotifications = async () => {
    try {
        const messaging = firebase.messaging();
        await Notification.requestPermission();
        const token = await messaging.getToken();

        let uri = '/api/v1/device/gcm/';
        createOrUpdateToken('create',token,uri)
        messaging.onTokenRefresh(async ()=>{
            let uri = `/api/v1/device/gcm/${token}/`
            const token = await messaging.getToken();
            createOrUpdateToken('update',token,uri);
        })
        
        return token;
    } catch (error) {
        //console.error(error);
    }
}

function createOrUpdateToken(action='create',token,uri){
    const formData = new FormData();
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRFToken': getCookie('csrftoken')
        },
    }
    formData.append('registration_id',token);
    formData.append('cloud_message_type','FCM');
    formData.append('active',true);

    if(action=='create'){
        axios.post(
            uri,
            formData,
            config
            ).then(response => {
            }).catch(error => {
            })
        }
    else{
        axios.patch(
            uri,
            formData,
            config
            ).then(response => {
            }).catch(error => {
            })
        }
    
}