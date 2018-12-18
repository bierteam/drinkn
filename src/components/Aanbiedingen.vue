<template>
  <div class="aanbiedingen">
    <h1>Aanbiedingen</h1>
    <div v-for="aanbieding in aanbiedingen" :key="aanbieding.id">
      <p>
        <span><b>{{ aanbieding.brand }}</b></span><br />
      </p>
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
