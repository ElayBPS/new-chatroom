<template>
  <div class="all" id="app">
    <img class="banner" src="../public/bannière.jpg">
    <button type="button" @click="logOut">🍍 Déconnexion 🍍</button>
    <div v-if="!user">
      <div class="connexion">
      <h3>Bienvenue dans le Chat #1! Inscrivez-vous ou Connectez-vous!</h3>
      <form @submit.prevent="login" v-if="loginPanel === 'login'">
        <input class="username" type="email" placeholder="Entrez votre email" v-model="loginModel.email">
        <input class="username" type="password" placeholder="Entrez votre mot de passe" v-model="loginModel.password">
        <button class="submit" type="submit">Rejoindre</button>
        <a @click="loginPanel='register'">🍍 Par ici pour s'inscrire!</a>
      </form>
      <form @submit.prevent="register" v-else-if="loginPanel === 'register'">
        <input class="username" type="email" placeholder="Entrez votre email" v-model="registerModel.email">
        <input class="username" type="username" placeholder="Entrez votre nom d'utilisateur" v-model="registerModel.username">
        <input class="username" type="password" placeholder="Entrez votre mot de passe" v-model="registerModel.password">
        <button class="submit" type="submit">Rejoindre</button>
        <a @click="loginPanel='login'">🍍 Déjà inscrit? Cliquez ici!</a>
      </form>
    </div>
    </div>
    <div v-else>
      <div class="sending">
      <ul ref="scroll" id="chatbox">
        <li v-for="(message, index) in messages" :key="'message-'+ index">
          <div class="message" v-if="message.type === 'text'">
            <b>{{message.username}}</b>: {{message.text}}
          </div>
          <div class="audio" v-else-if="message.type === 'audio'">
            <audio :src="message.src" controls></audio>
          </div>
          <div class="video" v-else-if="message.type === 'video'">
            <video :src="message.src" controls></video>
          </div>
          <div class="image" v-else-if="message.type === 'image'">
            <img :src="message.src">
          </div>
          <div class="file" v-else>
            <a :href="message.src" target="_blank" >{{message.name}}</a>
          </div>
        </li>
      </ul>
      </div>
      <form class="msg" @submit.prevent="sendMessage">
        <button class="ory3u">
            <span data-icon="smiley" class>
              <svg
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24">
                <path
                  opacity=".45"
                  fill="#263238"
                  d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z">
                  </path>
              </svg>
            </span>
        </button>
        <input class="msge" type="text" placeholder="Tapez votre message..." v-model="message">
        <button type="button" @click="stopRecord" v-if="recording"><i class="material-icons">stop</i></button>
        <button type="button" @click="record('audio')" v-if="!recording"><i class="material-icons">mic</i></button>
        <button type="button" @click="record('video')" v-if="!recording"><i class="material-icons">videocam</i></button>
        <button type="button" @click="$refs.attach_file.click()"><i class="material-icons">attach_file</i></button>
        <input type="file" ref="attach_file" style="display:none" @change="sendFile">
        <input type="submit" value="Envoyer">
      </form>
    
    </div>
  </div>
</template>

<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js');
}
import * as firebase from "firebase" 
// Initialize Firebase
import config from '@/assets/firebase-config.js' 

  firebase.initializeApp(config);

const messaging = firebase.messaging();
messaging.usePublicVapidKey("BHJuoVLNyjDAKjk0M-NGUsxMnDJpi3QuC8HklIUkJcmY1GK6SrV9VcgM03JlykAiUpyCBV1bV6-hO-a9TB4lAxM");
const getNotificationToken = function() {
 messaging.requestPermission().then(function() {
  console.log('Notification permission granted.');
  // TODO(developer): Retrieve an Instance ID token for use with FCM.
  // Get Instance ID token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
messaging.getToken().then(function(currentToken) {
  if (currentToken) {
    firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid).set({fcm_token: currentToken}, {merge: true})
  } else {
    // Show permission request.
    console.log('No Instance ID token available. Request permission to generate one.');
  }
}).catch(function(err) {
  console.log('An error occurred while retrieving token. ', err);
});
  // ...
}).catch(function(err) {
  console.log('Unable to get permission to notify.', err);
});
}

export default {
  name: "app",
  data: () => {
    return {
      message: "",
      messages: [],
      username: "",
      recording: false,
      loginModel: {email:"", password:""},
      loginPanel: "login",
      registerModel: {email:"", username:"", password:""},
      user: null,
      state: 0
    };
  },
  methods: {
    sendMessage: function() {
      if (this.message) {
        const message = {
        id : firebase.firestore().collection("messages").doc().id,
        username : this.username,
        text : this.message,
        date : firebase.firestore.FieldValue.serverTimestamp(),
        type : "text",
        // userId : 
      }
      firebase.firestore().collection("messages").doc(message.id).set(message)
      this.message = "";
      this.$refs.messageInput.clear();
      }
    },
    login: function () {
      firebase.auth().signInWithEmailAndPassword(this.loginModel.email, this.loginModel.password)
    },
    register: function () {
      firebase.auth().createUserWithEmailAndPassword(this.registerModel.email, this.registerModel.password).then(() => {
        return firebase.auth().currentUser.updateProfile({displayName: this.registerModel.username});
      }).then(() => {
        this.setUser(firebase.auth().currentUser)
      })
    },
    logOut: function () {
      firebase.auth().signOut()
      this.reset()
    },
    setUser: function(user) {
      this.user = user;
      if (user) {
        this.username = user.displayName;
        this.state = 1;
        firebase.firestore().collection("messages").orderBy("date", "asc").onSnapshot(messages => {
          this.messages = messages.docs.map(message => {
            return message.data()
        })
        this.$refs.scroll.scrollTop = this.$refs.scroll.scrollHeight
        getNotificationToken()
        firebase.firestore().collection("users").doc(firebase.auth().currentUser.uid).set(user)
      })
      }
    },
    // continueWithoutUsername: function() {
    //   this.state = 1;
    // },
    sendFile: function(e) {
      const file = e.target.files[0];
      if (file) {
        const fileType = file.type.split("/")
        const id = firebase.firestore().collection("messages").doc().id;
        firebase.storage().ref("files/" + id + "." + fileType[1]).put(file).then(upload => {
          return upload.ref.getDownloadURL()
        }).then(url => {
          const message = {
        id : firebase.firestore().collection("messages").doc().id,
        username : this.username,
        src : url,
        date : firebase.firestore.FieldValue.serverTimestamp(),
        type : fileType[0],
        name : file.name
         }
        firebase.firestore().collection("messages").doc(message.id).set(message)
        })
      }
    },
    stopRecord: function () {
      this.mediaRecorder.stop()
      clearTimeout(this.recordTO)
    },
    record: async function (type="audio") {
    this.recording = true
    const config = {audio: true, video: type === "video"}
    // Access user media and ask permission if needed
    const stream = await navigator.mediaDevices.getUserMedia(config)
    // Instanciate MediaRecorder using media device
    const mimeType = type+"/webm"
    this.mediaRecorder = new MediaRecorder(stream, {mimeType})

    // Stop the recording after 30 seconds
    this.recordTO = setTimeout(this.stopRecord, 30000)
    
    // Start recording!
    this.mediaRecorder.start()

    const audioChunks = []
    
    // Event triggered when audio data is available
    this.mediaRecorder.addEventListener("dataavailable", event => {
        // Push chunk of data in an array
        audioChunks.push(event.data)
    })

   this.mediaRecorder.addEventListener("stop", async () => {
        this.recording = false
        // Transform our array into a Blob
        const blob = new Blob(audioChunks, {type: mimeType})
        const id = firebase.firestore().collection("messages").doc().id;
        firebase.storage().ref("files/" + id + ".webm").put(blob, {contentType: mimeType}).then(upload => {
          return upload.ref.getDownloadURL()
        }).then(url => {
          const message = {
        id : firebase.firestore().collection("messages").doc().id,
        username : this.username,
        src : url,
        date : firebase.firestore.FieldValue.serverTimestamp(),
        type
         }
        firebase.firestore().collection("messages").doc(message.id).set(message)
        })
    })
  },
  reset: function() {
      this.loginModel = {email:"", password:""}
      this.loginPanel = "login"
      this.registerModel = {email:"", username:"", password:""}
  },
  },
  mounted: function() {
    firebase.auth().onAuthStateChanged(user => {
      this.setUser(user)
    })
    window.addEventListener("keypress", e => {
      if(e.which === 13) {
      e.preventDefault()
      e.stopPropagation()
      this.sendMessage()
      }
    })
  }
}
</script>