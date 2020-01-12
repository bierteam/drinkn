<template>
  <div>
    <a class="button is-warning" @click.once="Import()">Import</a>
    <ul v-if="status">
      {{status.data}}
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
      status: null
    }
  },

  // Pushes posts to the server when called.
  methods: {
    Import() {
      Api().post(`/api/v1/import`, {
      })
      .then(response => {
        this.status = response
      })
      .catch(e => {
        this.errors.push(e)
      })
    }
  }
}
</script>
