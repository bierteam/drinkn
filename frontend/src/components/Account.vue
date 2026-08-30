<script>
import Api from '../services/Api'
import pwned from '../services/pwned'
import { store } from '../store.js'
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import * as passkeyError from '../services/passkeyError'

export default {
  data () {
    return {
      user: {},
      newUser: {},
      verifyPassword: undefined,
      passkeyName: '',
      passkeySupported: browserSupportsWebAuthn(),
      debug: null,
      error: '',
      message: '',
      state: {
        error: false,
        saving: false,
        saved: false,
        isPwned: false,
        notEqual: false,
        deleteMsg: false,
        passkeyBusy: false
      }
    }
  },
  created () {
    this.Account()
  },
  computed: {
    isDisabled () {
      // Check if there is anything to edit (password or username)
      const stuffToEdit = this.newUser.password || this.newUser.username

      // Determine if the form should be disabled
      return !(stuffToEdit && !this.state.isPwned && !this.state.notEqual)
    },
    passkeys () {
      return this.user.credentials || []
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
    // attachment picks which kind of authenticator the browser offers:
    // 'platform' is this device, 'cross-platform' a key you plug in
    async AddPasskey (attachment) {
      this.error = ''
      this.message = ''
      this.debug = null
      this.state.passkeyBusy = true
      const isKey = attachment === 'cross-platform'
      try {
        const options = await Api().post(`/api/v1/account/passkey/options`, { attachment })
        const response = await startRegistration({ optionsJSON: options.data })
        const saved = await Api().post(`/api/v1/account/passkey`, {
          response,
          name: this.passkeyName || (isKey ? 'Security key' : 'Passkey')
        })
        this.user = saved.data
        this.passkeyName = ''
        this.message = 'Passkey added.'
      } catch (e) {
        // the full shape goes to the console; the short tag goes on screen, so
        // a failure can be reported without opening devtools
        const detail = passkeyError.log('registration', e)
        this.debug = detail

        // A password manager that hands the ceremony over -- Bitwarden's "use
        // hardware key", for one -- ends its own attempt to do it, which
        // surfaces here as an abort.
        if (detail.name === 'AbortError') return

        if (detail.name === 'InvalidStateError') {
          this.error = 'That authenticator already holds a passkey for this account. Use a different key.'
        } else if (detail.name === 'NotAllowedError') {
          // The browser will not say which of these it was, so name the ones
          // worth checking rather than guessing at one.
          this.error = isKey
            ? `The security key was not accepted (${passkeyError.tag(detail)}). Signing in without a username needs a discoverable credential, so the key must have a FIDO2 PIN set and a free slot for one.`
            : `No passkey was created (${passkeyError.tag(detail)}). The prompt may have timed out or been dismissed. To enrol a key you plug in, use "Add security key" instead.`
        } else {
          this.error = `${e.response?.data || detail.message || e} (${passkeyError.tag(detail)})`
        }
      } finally {
        this.state.passkeyBusy = false
      }
    },
    RemovePasskey (credentialID) {
      this.error = ''
      Api().delete(`/api/v1/account/passkey/${encodeURIComponent(credentialID)}`)
        .then(response => {
          this.user = response.data
          this.message = 'Passkey removed.'
        })
        .catch(e => {
          this.error = e.response?.data || e
          console.error(e)
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
        <div v-if="message" class="notification is-success">
          <button type="button" class="delete" @click="message = ''"></button>
          {{message}}
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
                <button class="button is-light is-large is-fullwidth" @click.prevent='Update' v-bind:class="{
                'is-loading': state.saving,
                'is-success': state.saved,
                'is-danger': state.error }" type="submit" :disabled="isDisabled">Save</button>
              </div>
              <div class="column">
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
        <div class="box">
          <h3 class="title has-text-grey">Passkeys</h3>
          <p class="subtitle has-text-grey is-6">Sign in with your fingerprint, face or security key instead of a password.</p>
          <div v-if="!passkeySupported" class="notification is-warning">
            This browser does not support passkeys.
          </div>
          <table v-if="passkeys.length" class="table is-fullwidth">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Added</th>
                <th scope="col"><span class="is-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="passkey in passkeys" :key="passkey.credentialID">
                <td>{{passkey.name}}</td>
                <td class="has-text-grey">{{new Date(passkey.createdAt).toLocaleDateString()}}</td>
                <td class="has-text-right">
                  <button class="button is-small is-danger is-light" type="button" @click='RemovePasskey(passkey.credentialID)'>Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="has-text-grey">No passkeys yet.</p>
          <details v-if="debug" class="mb-3">
            <summary class="has-text-grey is-size-7">Last passkey error</summary>
            <pre class="is-size-7">{{JSON.stringify(debug, null, 2)}}</pre>
          </details>
          <div v-if="passkeySupported" class="field has-addons">
            <div class="control is-expanded">
              <label class="is-sr-only" for="account-passkey-name">Passkey name</label>
              <input id="account-passkey-name" class="input" v-model="passkeyName" type="text" name="passkey-name" placeholder="Name this device (optional)">
            </div>
            <div class="control">
              <button class="button is-info" type="button" :class="{ 'is-loading': state.passkeyBusy }" @click="AddPasskey('platform')">Add passkey</button>
            </div>
            <div class="control">
              <button class="button is-info is-light" type="button" :class="{ 'is-loading': state.passkeyBusy }" @click="AddPasskey('cross-platform')">Add security key</button>
            </div>
          </div>
          <p class="help has-text-grey">
            &ldquo;Add passkey&rdquo; uses this device&rsquo;s fingerprint or face. &ldquo;Add security key&rdquo; goes
            straight to a key you plug in, so a password manager cannot take the prompt over.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</template>
