const functions = require('firebase-functions');
const firebase = require('firebase-admin');
firebase.initializeApp();
exports.sendNotification = functions.firestore.document("messages/{messageId}").onCreate(data => {
    const message = data.data()
    let text
    if (message.type === 'image') {
        text = '📷 Photo'
    }
    else if (message.type === 'video') {
        text = '🎥 Vidéo'
    }
    else if (message.type === 'file') {
        text = '📄 Document'
    }
    else if (message.type === 'audio') {
        text = '🎤 Audio'
    }
    else {
        text = message.text
    }
    // Retrouver la liste des utilisateurs depuis la database.
    return firebase.firestore().collection("users").get().then(users => {
        return Promise.all(users.docs.map(user => {
            const userData = user.data()
            var notification = {
                data: {
                    title: `${message.username}`,
                    message: text
                },
                token: userData.fcm_token
            }

            // Send a message to the device corresponding to the provided
            // registration token.
            return firebase.messaging().send(notification)
        }))
    })
})

// Faire une loop pour chaque utilisateurs et envoyer la notification à chaque utilisateurs en utlisant le code ci-dessous.

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
