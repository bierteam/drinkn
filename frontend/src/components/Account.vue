<script>
import Api from '../services/Api'
import pwned from '../services/pwned'
import QRCode from 'qrcode'
import { store } from '../store.js'

export default {
  data () {
    return {
      user: {},
      otp: {
        secret: '',
        uri: '',
        QRdata: ''
      },
      newUser: {},
      verifyPassword: undefined,
      error: '',
      state: {
        error: false,
        saving: false,
        saved: false,
        isPwned: false,
        notEqual: false,
        deleteMsg: false
      }
    }
  },
  created () {
    this.Account()
  },
  computed: {
    isDisabled () {
      // Check if there is anything to edit (password, username, or otp)
      const stuffToEdit = this.newUser.password || this.newUser.username || this.newUser.otp

      // Determine if the form should be disabled
      return !(this.newUser.oldPassword && stuffToEdit && !this.state.isPwned && !this.state.notEqual)
    }
  },
  watch: {
    // the pwned lookup is async, so it cannot live in the computed above: an
    // async getter returns a Promise, which is always truthy and left Save
    // permanently disabled. run it here and keep the computed synchronous.
    'newUser.password': async function (password) {
      this.state.notEqual = password !== this.verifyPassword
      this.state.isPwned = password ? await pwned(password) : false
    },
    verifyPassword (value) {
      this.state.notEqual = this.newUser.password !== value
    }
  },
  methods: {
    Account () {
      Api().get(`/api/v1/account`, {})
        .then(response => {
          if (response.status === 200) {
            // get correct user from array
            this.user = response.data
          }
        })
        .catch(e => {
          this.error = e.response.data || e
          console.error(e)
        })
    },
    Otp () {
      Api().get(`/api/v1/account/otp`, {})
        .then(response => {
          if (response.status === 200) {
            QRCode.toDataURL(response.data.uri, {
              errorCorrectionLevel: 'H'
            }, function (err, result) {
              if (err) console.error(err)
              response.data.QRdata = result
              return response.data
            })
            this.otp = response.data
          }
        })
        .catch(e => {
          this.error = e.response.data || e
          console.error()
        })
    },
    Update () {
      this.state.saved = false
      this.state.saving = true
      const user = this.newUser
      Api().post(`/api/v1/account`, {
        user
      })
        .then(response => {
          this.user = response.data
          this.state.saved = true
          this.state.saving = false
          this.state.error = false
          this.newUser = {}
          this.otp = {}
          this.verifyPassword = undefined
        })
        .catch(e => {
          this.error = e.response.data || e
          console.error(e)
          this.state.error = true
          this.state.saving = false
        })
    },
    Delete () {
      Api().delete(`/api/v1/account/delete`)
        .then(response => {
          if (response.status === 200) {
            store.logout()
            this.$router.push('/login')
          }
        })
        .catch(e => {
          this.error = e.response.data || e
          console.error(e)
        })
    }
  }
}
</script>

<template>
<body>
  <div class="hero-body">
    <div class="container">
      <div class="column is-4 is-offset-4">
        <div v-if="state.isPwned" class="notification is-warning">
          This password has been pwned.
        </div>
        <div v-if="state.notEqual" class="notification is-warning">
          The password is not the same.
        </div>
        <div v-if="error" class="notification is-danger">
          <button type="button" class="delete" @click="error = ''"></button>
          {{error}}
        </div>
        <h3 class="title has-text-grey">Edit your account</h3>
        <div class="box">
          <form>
            <div class="field">
              <div class="control">
                <label class="is-sr-only" for="account-username">Username</label>
                <input id="account-username" class="input is-large" v-model="newUser.username" type="text" name="username" autocomplete="username" :placeholder="user.username">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <label class="is-sr-only" for="account-old-password">Current password</label>
                <input id="account-old-password" class="input is-large" v-model="newUser.oldPassword" type="password" name="current-password" autocomplete="current-password" placeholder="Your password *">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <label class="is-sr-only" for="account-new-password">New password</label>
                <input id="account-new-password" class="input is-large" v-model="newUser.password" type="password" name="new-password" autocomplete="new-password" placeholder="Your new password">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <label class="is-sr-only" for="account-verify-password">Verify new password</label>
                <input id="account-verify-password" class="input is-large" v-model="verifyPassword" type="password" name="verify-password" autocomplete="new-password" placeholder="Verify new password">
              </div>
            </div>
            <div class="columns">
              <div class="column">
                <div class="field">
                  <div class="control">
                    <label class="is-sr-only" for="account-otp">Two factor code</label>
                    <input id="account-otp" class="input is-large" :disabled="user.otp && user.otp.status" v-model="newUser.otp" type="text" name="otp" inputmode="numeric" autocomplete="one-time-code" placeholder="2FA code">
                  </div>
                </div>
                <button class="button is-light is-large is-fullwidth" @click.prevent='Update' v-bind:class="{
                'is-loading': state.saving,
                'is-success': state.saved,
                'is-danger': state.error }" type="submit" :disabled="isDisabled">Save</button>
              </div>
              <div class="column">
                <div class="field">
                  <div class="control">
                    <button class="button is-info is-large is-fullwidth" :disabled="user.otp && user.otp.status" @click.once='Otp()' type="button">Setup 2FA</button>
                  </div>
                </div>
                <button class="button is-danger is-large is-fullwidth" @click='state.deleteMsg = !state.deleteMsg' type="button">Delete account</button>
              </div>
            </div>
            <div v-if="state.deleteMsg" class="notification is-light">
              <button type="button" class="delete" @click="state.deleteMsg = false"></button>
              Are you sure? This is permanent.
              <br><br>
              <button class="button is-danger is-large" @click='Delete' type="button">I am sure!</button>
            </div>
          </form>
        </div>
        <div v-if="otp.secret" class="box">
          <h3 class="title has-text-grey">Scan this QR code</h3>
          <a :href='otp.uri'>
            <div class="container" id="qrcode">
              <img id="preview" src="/favicon.ico" alt="Beer emoji">
              <img :src='otp.QRdata' :alt='otp.uri'>
            </div>
          </a>
          <h4 class="has-text-grey">{{otp.secret}}</h4>
        </div>
      </div>
    </div>
  </div>
</body>
</template>

<style>
#qrcode {
  position: relative;
  max-width: 256px;
  display: block;
}

#preview {
  position: absolute;
  height: calc(100% / 3);
  width: calc(100% / 3);
  left: calc(100% / 3);
  top: calc(100% / 3);
}
</style>
