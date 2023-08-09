<template>
<div class='container'>
  <div v-if="message" @click="message = ''" class="notification is-danger">
    <button class="delete" @click="message = ''"></button>
    {{message}}
  </div>
  <table class='table'>
    <caption class='is-hidden'>Table of logs</caption>
    <thead>
      <tr>
        <!-- first row -->
        <th></th>
        <!-- <th><a class="button is-danger" @click='state.deleteMsg = !state.deleteMsg'>Delete all logs</a></th> -->
        <div v-if="state.deleteMsg" class="notification is-light">
          <button class="delete" @click="state.deleteMsg = false"></button>
          Are you sure? This is permanent.
          <br><br>
          <Button class="button is-danger is-large" @click.once="deleteLogs" type="button">I am sure!</Button>
        </div>
        <th>
          <div class="control has-icons-right">
            <input class='input' type='text' placeholder='Search' v-model="search">
            <span class="icon is-small is-right">
              <i class="delete" :class="{'is-hidden': !search }" @click='search = null'></i>
            </span>
          </div>
        </th>
        <th>
          <div class="dropdown is-hoverable">
            <div class="dropdown-trigger">
              <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                <div @click='context = null'>{{ context || "Select a context" }}</div>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu" role="menu">
              <div class="dropdown-content" v-for="option in contexts" :key='option'>
                <a class="dropdown-item" @click='context = option'>{{ option }}</a>
              </div>
            </div>
          </div>
        </th>
        <th>
          <div class="dropdown is-hoverable">
            <div class="dropdown-trigger">
              <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                <div @click='type = null'>{{ type || "Select a type" }}</div>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu" role="menu">
              <div class="dropdown-content" v-for="option in types" :key='option'>
                <a class="dropdown-item" @click='type = option'>{{ option }}</a>
              </div>
            </div>
          </div>
        </th>
        <th></th>
      </tr>
      <tr>
        <!-- second row -->
        <th v-for='(key, value) in headers' @click='sort(value)' :key='key'>{{ key }}</th>
      </tr>
    </thead>
    <tfoot>
      <!-- bottom row -->
      <tr>
        <th v-for='(key, value) in headers' @click='sort(value)' :key='key'>{{ key }}</th>
      </tr>
    </tfoot>

    <tbody>
      <!-- table -->
      <tr v-for='log in processed' :key='log.id'>
        <td>{{log.date}}</td>
        <td @click='search = log.message' :title=log.message>{{log.message.slice(0, 50) + '...'}}</td>
        <td @click='context = log.context'>{{log.context}}</td>
        <td @click='type = log.type'>{{log.type}}</td>
        <td @click='search = log.ip'>{{log.ip}}</td>
      </tr>
    </tbody>
  </table>
</div>
</template>

<script>
import Api from '/src/services/Api'
import Vue2Filters from 'vue2-filters'

export default {
  mixins: [Vue2Filters.mixin],
  data() {
    return {
      search: '',
      context: '',
      contexts: [],
      type: '',
      types: [],
      ip: '',
      logs: [],
      message: '',
      headers: {
        Date: 'Date',
        Message: 'Message',
        Context: 'Context',
        Type: 'Type',
        Ip: 'Ip'
      },
      state: {
        deleteMsg: false
      }
    }
  },
  updated() {
    const query = {}
    if (this.search) query.search = this.search
    if (this.context) query.context = this.context
    if (this.type) query.type = this.type
    this.$router.replace({
      query
    })
  },
  mounted() {
    this.getLogs()
    this.search = this.$route.query.search
    this.context = this.$route.query.context
    this.type = this.$route.query.type
  },
  computed: {
    processed: function () {
      let data = this.logs
      data = this.filterBy(data, this.search)
      data = this.filterBy(data, this.context)
      data = this.filterBy(data, this.type)
      return data
    }
  },
  methods: {
    async getLogs() {
      try {
        const response = await Api().get('/api/v1/logging')
        this.logs = response.data

        // Create separate arrays for contexts and types if they don't exist already
        this.contexts = this.contexts || []
        this.types = this.types || []

        for (const log of response.data) {
          if (!this.contexts.includes(log.context)) {
            this.contexts.push(log.context)
          }
          if (!this.types.includes(log.type)) {
            this.types.push(log.type)
          }
        }
      } catch (error) {
        console.error('Error fetching logs:', error)
      }
    },
    async deleteLogs() {
      try {
        const response = await Api().delete('/api/v1/logging')
        this.message = response.data
        this.logs = []
      } catch (error) {
        console.error('Error deleting logs:', error)
      }
    }
  }
}
</script>
