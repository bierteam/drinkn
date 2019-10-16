<template>
  <body>
    <div class="hero-body">
      <div class="container">
        <div class="column is-4 is-offset-4">
          <div v-if="state.pwned" class="notification is-warning">
              This password has been pwned.
          </div>
          <div v-if="state.notEqual" class="notification is-warning">
              The password is not the same.
          </div>
          <div v-if="error" class="notification is-danger">
            <button class="delete" @click="error = ''"></button>
              {{error}}
          </div>
          <h3 class="title has-text-grey">Edit your account</h3>
          <div class="box">
            <form>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.username" type="username" :placeholder="user.username">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.oldPassword" type="password" placeholder="Your password *">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="newUser.password" type="password" placeholder="Your new password">
              </div>
            </div>
            <div class="field">
              <div class="control">
                <input class="input is-large" v-model="verifyPassword" type="password" placeholder="Verify new password">
              </div>
            </div>
            <div class="columns">
              <div class="column">
                <div class="field">
                  <div class="control">
                    <input class="input is-large" :disabled="user.otp && user.otp.status" v-model="newUser.otp" type="string" placeholder="2FA code">
                  </div>
                </div>
                <Button class="button is-light is-large is-fullwidth" @click.prevent='Update' v-bind:class="{
                'is-loading': state.saving,
                'is-success': state.saved,
                'is-danger': state.error }"
                type="submit" :disabled="isDisabled">Save</Button>
              </div>
              <div class="column">
                <div class="field">
                  <div class="control">
                  <Button class="button is-info is-large is-fullwidth" :disabled="user.otp && user.otp.status" @click.once='Otp()' type="button" >Setup 2FA</Button>
                  </div>
                </div>
                <Button class="button is-danger is-large is-fullwidth" @click='state.deleteMsg = !state.deleteMsg' type="button" >Delete account</Button>
              </div>
            </div>
            <div v-if="state.deleteMsg" class="notification is-light">
              <button class="delete" @click="state.deleteMsg = false"></button>
              Are you sure? This is permanent.
              <br><br>
              <Button class="button is-danger is-large" @click='Delete' type="button" >I am sure!</Button>
            </div>
            </form>
          </div>
          <div  v-if="otp.secret" class="box">
            <h3 class="title has-text-grey">Scan this QR code</h3>
            <a :href='otp.uri'>
              <div class="container" id="qrcode">
                <img id="preview" src="/favicon.ico">
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

<script>
  import Api from '@/services/Api'
  import pwned from "havetheybeenpwned"
  import QRCode from "qrcode"

  export default {
    data() {
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
          pwned: false,
          notEqual: false,
          deleteMsg: false
        }
      }
    },
    created () {
      this.Account()
    },
    computed: {
      isDisabled:function() {
        pwned(this.newUser.password).then(isPwned => {
          this.state.pwned = isPwned
        })

        if (this.newUser.password !== this.verifyPassword) {
          this.state.notEqual = true
        } else {
          this.state.notEqual = false
        }
        
        const stuffToEdit = (this.newUser.password || this.newUser.username || this.newUser.otp) ? true : false
        
        return (this.newUser.oldPassword && stuffToEdit && !this.state.pwned && !this.state.notEqual) ? false : true
      }
    },
    methods: {
      Account() {
        Api().get(`/api/v1/account`, {})
        .then( response => {
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
      Otp() {
        Api().get(`/api/v1/account/otp`, {})
        .then( response => {
          if (response.status === 200) {
             QRCode.toDataURL(response.data.uri, { errorCorrectionLevel: 'H' }, function (err, result) {
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
      Update() {
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
      Delete() {
        Api().delete(`/api/v1/account/delete`)
        .then(response => {
          if (response.status === 200) {
            localStorage.clear()
            this.$parent.isAuthenticated = false
            this.$parent.isAdmin = false
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
