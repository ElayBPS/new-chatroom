<template>
  <div id="app">
    <h1>Chatroom</h1>
    <div v-if="state == 0">
      <h3>Bienvenu! Choisissez un nom d'utilisateur</h3>
      <form @submit.prevent="setUsername">
        <input type="text" placeholder="Username..." v-model:value="username">
        <input type="submit" value="Join">
      </form>
      <button @click="continueWithoutUsername">Rejoindre en temps qu'invité</button>
    </div>
    <div v-if="state == 1">
      <ul id="chatbox">
        <li v-for="message in messages">{{message}}</li>
      </ul>
      <form @submit.prevent="sendMessage">
        <input type="text" placeholder="Message..." v-model:value="message">
        <input type="submit" value="Envoyer">
      </form>
    </div>
  </div>
</template>

<script>
var app = new Vue({
  el: "#app",
  data: {
    message: "",
    messages: [],
    username: "",
    state: 0
  },
  methods: {
    sendMessage: function() {
      this.message = "";
    },
    setUsername: function() {
      this.username = "";
      this.state = 1;
    },
    continueWithoutUsername: function() {
      this.state = 1;
    }
  },
  mounted: function() {}
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
