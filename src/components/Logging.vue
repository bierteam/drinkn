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
import logging from '@/services/Logging'
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
      const response = await logging.fetchLogs()
      this.logging = response.data
    },
    async deleteLogs() {
      logging.deleteLogs()
    }
  }
}
</script>
