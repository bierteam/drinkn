<template>
  <div class="aanbiedingen">
    <h1>Aanbiedingen</h1>

    <!-- <div v-for="aanbieding in aanbiedingen" :key="aanbieding.id">
      <p>
        <span><b>{{ aanbieding.brand }}</b></span><br />
      </p>
    </div> -->

  <div id="table">
      <b-input-group class="mt-3 mb-3" size="sm">
          <b-form-input v-model="keyword" placeholder="Search" type="text"></b-form-input>
          <b-input-group-text slot="append">
              <b-btn class="p-0" :disabled="!keyword" variant="link" @click="keyword = ''"><i class="fa fa-remove"></i></b-btn>
          </b-input-group-text>
      </b-input-group>
      <b-table :fields="fields" :items="items" :keyword="keyword"></b-table>
  </div>
 
  </div>
</template>

<script>
import aanbiedingen from '@/services/aanbiedingen'
export default {
  name: 'aanbiedingen',
  data () {
    return {
      aanbiedingen: []
    }
  },
  mounted () {
    this.getPils()
  },
  methods: {
    async getPils () {
      const response = await aanbiedingen.fetchPils()
      this.aanbiedingen = response.data
    }
  }
}
</script>

<style>
#table {
	margin: 0 auto;
	width: 500px;
}
</style>

