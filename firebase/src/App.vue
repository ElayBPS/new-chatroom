<template>
  <div class="all" id="app">
    <h1>Our Carribean Chat</h1>
    <div v-if="!user">
      <h3>Bienvenue dans le Chat #1! Choisissez un nom d'utilisateur</h3>
      <form @submit.prevent="login" v-if="loginPanel === 'login'">
        <input class="username" type="email" placeholder="Entrez votre email" v-model="loginModel.email">
        <input class="username" type="password" placeholder="Entrez votre mot de passe" v-model="loginModel.password">
        <input class="submit" type="submit" value="Rejoindre">
        <a @click="loginPanel='register'">Vous pouvez vous inscrire ici</a>
      </form>
      <form @submit.prevent="register" v-else-if="loginPanel === 'register'">
        <input class="username" type="email" placeholder="Entrez votre email" v-model="registerModel.email">
        <input class="username" type="username" placeholder="Entrez votre nom d'utilisateur" v-model="registerModel.username">
        <input class="username" type="password" placeholder="Entrez votre mot de passe" v-model="registerModel.password">
        <input class="submit" type="submit" value="Rejoindre">
        <a @click="loginPanel='login'">Déjà inscrit? Cliquez ici</a>
      </form>
      <div class=bouton>
      <button @click="continueWithoutUsername">Rejoindre en tant qu'invité</button>
      </div>
    </div>
    <div v-else>
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
      <form class="msg" @submit.prevent="sendMessage">
        <!-- <button type="button" @click="showSmiley"><i class="material-icons">tag_faces</i></button> -->
        <VueEmoji @input="message=$event.data" @keypress.enter.prevent="sendMessage" ref="messageInput" class="message" placeholder="Message..."/>
        <button type="button" @click="stopRecord" v-if="recording"><i class="material-icons">mic_off</i></button>
        <button type="button" @click="record" v-else><i class="material-icons">mic</i></button>
        <button type="button" @click="$refs.attach_file.click()"><i class="material-icons">attach_file</i></button>
        <input type="file" ref="attach_file" style="display:none" @change="sendFile">
        <input type="submit" value="Envoyer">
      </form>
      <button type="button" @click="logOut">Déconnexion</button>
    </div>
  </div>
</template>

<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js');
}
import VueEmoji from 'emoji-vue'
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
  components: {VueEmoji},
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
        type : "text"
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
      })
      }
    },
    continueWithoutUsername: function() {
      this.state = 1;
    },
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
    record: async function () {
    this.recording = true
    // Access user media and ask permission if needed
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Instanciate MediaRecorder using media device
    this.mediaRecorder = new MediaRecorder(stream, {mimeType : "audio/webm"})

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
        const blob = new Blob(audioChunks)
        const id = firebase.firestore().collection("messages").doc().id;
        firebase.storage().ref("files/" + id + ".webm").put(blob).then(upload => {
          return upload.ref.getDownloadURL()
        }).then(url => {
          const message = {
        id : firebase.firestore().collection("messages").doc().id,
        username : this.username,
        src : url,
        date : firebase.firestore.FieldValue.serverTimestamp(),
        type : "audio"
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
  // showSmiley: function() {

  // }
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