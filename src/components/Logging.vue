<template>
  <div class='container'>
    <table class='table container'>
      <thead>
        <tr> <!-- first row -->
          <th><a class="button is-danger" @click.once="deleteLogs">Delete all logs</a></th>
          <th><input class='input' type='text' placeholder='Search' v-model="search"></th>
          <th>
            <div class="select">
              <select v-model="context">
                <option disabled value="">Select a context</option>
                <option v-for="option in contexts">{{option}}</option>
              </select>
            </div>
          </th>
          <th>
            <div class="select">
              <select v-model="type">
                <option disabled value="">Select a type</option>
                <option v-for="option in types">{{option}}</option>
              </select>
            </div>
          </th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
        <tr> <!-- second row -->
          <th v-for='(key, value) in headers' @click='sort(value)'>{{ key }}</th>
        </tr>
      </thead>
      <tfoot> <!-- bottom row -->
        <tr>
          <th v-for='(key, value) in headers' @click='sort(value)'>{{ key }}</th>
        </tr>
      </tfoot>
      
      <tbody> <!-- table -->
        <tr v-for='log in logs' :key='log.id'>
          <td>{{log.date}}</td>
          <td>{{log.message}}</td>
          <td>{{log.context}}</td>
          <td>{{log.type}}</td>
        </tr>   
      </tbody>
    </table>
  </div>
</template>

<script>
import Api from '@/services/Api'

export default {
  data () {
    return {
      search: '',
      context: '',
      contexts: [],
      type: '',
      types: [],
      logs: [],
      headers: {
        Date: 'Date',
        Message: 'Message',
        Context: 'Context',
        Type: 'Type'
      }
    }
  },
  updated () {
    const query = {}
    query.search = this.search
    query.context = this.context
    query.type = this.type
    this.$router.replace({query})
  },
  mounted () {
    this.getLogs()
    this.search = this.$route.query.search
    this.context = this.$route.query.context
    this.type = this.$route.query.type
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
      const response = Api().delete(`/api/v1/logging`)
      // TODO show message of results
      this.logs = []
    }
  }
}
</script>
