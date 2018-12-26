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
    <table class="table">
      <thead>
        <tr>
          <th>Link</th>
          <th>Brand</th>
          <th>Store</th>
          <th>Old price</th>
          <th>New price</th>
          <th>Discount</th>
          <th>Discount %</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th>Link</th>
          <th>Brand</th>
          <th>Store</th>
          <th>Old price</th>
          <th>New price</th>
          <th>Discount</th>
          <th>Discount %</th>
          <th>Volume</th>
        </tr>
      </tfoot>
      <tbody>
        <tr v-for="aanbieding in aanbiedingen" :key="aanbieding.id">
          <a v-if="aanbieding.uri" :href="aanbieding.uri" class="button is-success">Buy!</a>
          <a v-else></a>
          <td>{{ aanbieding.brand }}</td>
          <td>{{ aanbieding.store }} </td>
          <td>€{{ (aanbieding.pricing.oldPrice / 100).toFixed(2) }}</td>
          <td>€{{ (aanbieding.pricing.newPrice / 100).toFixed(2) }}</td>
          <td>€{{ ((aanbieding.pricing.oldPrice - aanbieding.pricing.newPrice) / 100).toFixed(2) }}</td>
          <td>{{ (100 - (aanbieding.pricing.newPrice * 100 / aanbieding.pricing.oldPrice)).toPrecision(2) }}%</td>
          <td>{{ aanbieding.volume }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import aanbiedingen from '@/services/Aanbiedingen'
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
