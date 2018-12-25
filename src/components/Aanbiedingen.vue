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
          <td>€{{ aanbieding.pricing.oldPrice }}</td>
          <td>€{{ aanbieding.pricing.newPrice }}</td>
          <td>€{{ aanbieding.pricing.discountAmount }}</td>
          <td>{{ aanbieding.pricing.discountPercentage }}%</td>
          <td>{{ aanbieding.volume }}</td>
        </tr>
      </tbody>
    </table>
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
