<template>
  <div class='container'>
    <div v-if="message" @click="message = ''" class="notification is-danger">
      <button class="delete" @click="message = ''"></button>
      {{message}}
    </div>
    <table class='table container'>
      <thead>
        <tr> <!-- first row -->
          <th><a class="button is-danger" @click.once="deleteLogs">Delete all logs</a></th>
          <th><input class='input' type='text' placeholder='Search' v-model="search"></th>
          <th>
            <div class="select">
              <select v-model="context">
                <option value="">Select a context</option>
                <option v-for="option in contexts" :key='option'>{{option}}</option>
              </select>
            </div>
          </th>
          <th>
            <div class="select">
              <select v-model="type">
                <option value="">Select a type</option>
                <option v-for="option in types" :key='option'>{{option}}</option>
              </select>
            </div>
          </th>
          <th></th>
        </tr>
        <tr> <!-- second row -->
          <th v-for='(key, value) in headers' @click='sort(value)' :key='key'>{{ key }}</th>
        </tr>
      </thead>
      <tfoot> <!-- bottom row -->
        <tr>
          <th v-for='(key, value) in headers' @click='sort(value)' :key='key'>{{ key }}</th>
        </tr>
      </tfoot>
      
      <tbody> <!-- table -->
        <tr v-for='log in processed' :key='log.id'>
          <td>{{log.date}}</td>
          <td @click='search = log.message'>{{log.message}}</td>
          <td @click='context = log.context'>{{log.context}}</td>
          <td @click='type = log.type'>{{log.type}}</td>
          <td @click='search = log.ip'>{{log.ip}}</td>
        </tr>   
      </tbody>
    </table>
  </div>
</template>

<script>
import Api from '@/services/Api'
import Vue2Filters from 'vue2-filters'

export default {
  mixins: [Vue2Filters.mixin],
  data () {
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
      }
    }
  },
  updated () {
    const query = {}
    if (this.search) query.search = this.search
    if (this.context) query.context = this.context
    if (this.type) query.type = this.type
    this.$router.replace({query})
  },
  mounted () {
    this.getLogs()
    this.search = this.$route.query.search
    this.context = this.$route.query.context
    this.type = this.$route.query.type
  },
  computed:{
    processed:function() {
      let data = this.logs
      data = this.filterBy(data, this.search)
      data = this.filterBy(data, this.context)
      data = this.filterBy(data, this.type)
      return data
    }
  },
  methods: {
    async getLogs () {
      const response = await Api().get('/api/v1/logging')
      this.logs = response.data
      for (let i = 0; i < response.data.length; i++){
        if (this.contexts.indexOf(response.data[i].context) === -1) {
          this.contexts.push(response.data[i].context)
        }
        if (this.types.indexOf(response.data[i].type) === -1) {
          this.types.push(response.data[i].type)
        }
      }
    },
    async deleteLogs() {
      const response = await Api().delete(`/api/v1/logging`)
      this.message = response.data
      this.logs = []
    }
  }
}
</script>
