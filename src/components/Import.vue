<template>
  <div>
    <a class="button is-warning" @click.once="Import()">Import</a>
    <ul v-if="status">
      {{status.data}}
    </ul>
    <br>
    <br>
    <a class="button is-success" @click="Query()">Refresh</a>  <!-- this is temporary -->
    <ul v-if="refreshStatus">
      {{refreshStatus.data}}
    </ul>

    <ul v-if="errors && errors.length">
      <li v-for="error of errors">
        {{error.message}}
      </li>
    </ul>
    <br>
    <br>
  </div>
</template>

<script>
import Api from '@/services/Api'

export default {
  data() {
    return {
      errors: [],
      status: null,
      refreshStatus: null
    }
  },

  // Pushes posts to the server when called.
  methods: {
    Import() {
      Api().post(`api/v1/import`, {
      })
      .then(response => {
        this.status = response
      })
      .catch(e => {
        this.errors.push(e)
      })
    },
    Query() { // this is temporary
      Api().post(`api/v1/query`, {
      })
      .then(response => {
        this.refreshStatus = response
      })
      .catch(e => {
        this.errors.push(e)
      })
    }
  }
}
</script>
