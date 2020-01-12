<template>
  <div>
    <div class="buttons is-centered">
      <span class="button is-warning" @click='Cancel' type="button" :disabled="isEmpty">Cancel</span>
      <span class="button is-info" @click='Update' v-bind:class="{
        'is-loading': isSaving,
        'is-success': isSaved,
        'is-danger': isError }"
        type="button" :disabled="isEmpty">Save</span>
    </div>
    <table class='container table'>
      <thead>
        <th>Old</th>
        <th>New</th>
      </thead>
      <tbody>
        <tr v-for='(newName, oldName) in stores'>
          <th><input class="input" type="text" v-model="oldName" disabled></th>
          <th><input class="input" type="text" :placeholder="newName" v-model="newStores[oldName]"></th>
          <!-- <span class="delete" @click='Delete(oldName)'></span> -->
        </tr>
        <tr>
          <th></th>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import Api from '@/services/Api'

export default {
  data() {
    return {
      stores: {},
      newStores: {},
      isSaving: false,
      isSaved: false,
      isError: false,
      // isEmpty: true,
    }
  },
  mounted () {
    this.Get()
  },
  computed: {
    isEmpty:function() {
      return Object.getOwnPropertyNames(this.newStores).length === 1
    }
  },
  methods: {
    Get() {
      Api().get(`/api/v1/stores`, {
      })
      .then(response => {
        this.stores = response.data
        delete this.stores._id
        delete this.stores.__v
      })
      .catch(e => {
        console.error(e)
      })
    },
    Cancel() {
      this.newStores = {}
    },
    Update() {
      this.isSaved = false
      this.isSaving = true
      const newStores = this.$data.newStores
      Api().post(`/api/v1/stores`, {
        newStores
      })
      .then(response => {
        this.stores = response.data
        delete this.stores._id
        delete this.stores.__v
        this.newStores = {}
        this.isSaved = true
        this.isSaving = false
      })
      .catch(e => {
        console.error(e)
        this.isError = true
        this.isSaving = false
      })
    },
    Delete(remove) { // WIP
      Api().delete(`/api/v1/stores`, {
        data: {
          remove
        }
      })
      .then(response => {
      })
      .catch(e => {
        console.error(e)
      })
    }
  }
}
</script>
