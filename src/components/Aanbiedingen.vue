<template>
  <div>
    <nav class="level">
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Aanbiedingen</p>
          <p class="title">3,456</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Gemmiddelde korting</p>
          <p class="title">123</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Online aanbiedingen</p>
          <p class="title">456K</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Nog een vakje</p>
          <p class="title">789</p>
        </div>
      </div>
    </nav>
    <div class="aanbiedingen">
      <h1 class="title">Aanbiedingen</h1>
      <div v-for="aanbieding in aanbiedingen" :key="aanbieding.id">
        <p>
          <span><b>{{ aanbieding.brand }}</b></span><br />
        </p>
      </div>
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
