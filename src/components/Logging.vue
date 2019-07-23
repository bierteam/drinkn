<template>
  <div class='container'>
    <table class='table container'>
      <thead>
        <!-- first row -->
        <tr>
          <th><input class='input' type='text' placeholder='Search'></th>
          <th>
            <div class="select">
              <select v-model="store">
                <option disabled value="">Select a context</option>
                
                <!--<option v-for="option in stores"> 
                  
                </option>
                -->
              </select>
               
            </div>
          <a class="button is-danger" @click.once="deleteLogs">Delete all logs</a>
          </th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
        <!-- second row -->
        <tr>
          <th v-for='(key, value) in headers' @click='sort(value)'>{{ key }}</th>

        </tr>
      </thead>
      <tfoot>
        <tr>
          <th v-for='(key, value) in headers' @click='sort(value)'>{{ key }}</th>

        </tr>
      </tfoot>
      
      <tbody>
        <!-- table -->
        
        <tr v-for='log in logging' :key='log.id'>
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
  name: 'aanbiedingen',
  data () {
    return {
      logging: [],
      headers: {
        Date: 'Date',
        Message: 'Message',
        Context: 'Context',
        Type: 'Type'
      }
    }
  },
  mounted () {
    this.getLogs()
  },
  methods: {
    async getLogs () {
      const response = await Api().get('api/v1/logging/logs')
      this.logging = response.data
    },
    async deleteLogs() {
      const response = Api().delete(`api/v1/logging/logs`)
      // TODO show message of results and remove logs of page
    }
  }
}
</script>
