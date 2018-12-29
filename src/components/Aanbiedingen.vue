<template>
  <div>
    <nav class="level">
      <div class="level-item has-text-centered">
        <div>
          <p class="heading">Aanbiedingen</p>
          <p class="title">{{aanbiedingen.length}}</p>
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
    <input v-model="search" class="input" type="text" placeholder="Search">
    debug: sort={{currentSort}}, dir={{currentSortDir}}
    <table class="table">
      <thead>
        <tr>
          <th @click="sort('brand')">Brand</th>
          <th @click="sort('store')">Store</th>
          <th @click="sort('pricing.oldPrice')">Old price</th>
          <th @click="sort('pricing.oldPrice')">New price</th>
          <th @click="sort('placeholder')">Discount</th>
          <th @click="sort('placeholder')">Discount %</th>
          <th @click="sort('volume')">Volume</th>
          <th @click="sort('uri')">Link</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="aanbieding in sortedAanbiedingen" :key="aanbieding.id">
          <td>{{ aanbieding.brand }}</td>
          <td>{{ aanbieding.store }} </td>
          <td>€{{ (aanbieding.pricing.oldPrice / 100).toFixed(2) }}</td>
          <td>€{{ (aanbieding.pricing.newPrice / 100).toFixed(2) }}</td>
          <td>€{{ ((aanbieding.pricing.oldPrice - aanbieding.pricing.newPrice) / 100).toFixed(2) }}</td>
          <td>{{ (100 - (aanbieding.pricing.newPrice * 100 / aanbieding.pricing.oldPrice)).toPrecision(2) }}%</td>
          <td>{{ aanbieding.volume }}</td>
          <a v-if="aanbieding.uri" :href="aanbieding.uri" class="button is-success">Buy!</a>
          <a v-else></a>
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
      aanbiedingen: [],
      search: '',
      currentSort:'name',
      currentSortDir:'asc'
    }
  },
  mounted () {
    this.getPils()
  },
  methods: {
    async getPils () {
      const response = await aanbiedingen.fetchPils()
      this.aanbiedingen = response.data
    },
    sort:function(s) {
      //if s == current sort, reverse
      if(s === this.currentSort) {
        this.currentSortDir = this.currentSortDir==='asc'?'desc':'asc';
      }
      this.currentSort = s;
    }
  },
  computed:{
    sortedAanbiedingen:function() {
      return this.aanbiedingen.sort((a,b) => {
        let modifier = 1;
        if(this.currentSortDir === 'desc') modifier = -1;
        if(a[this.currentSort] < b[this.currentSort]) return -1 * modifier;
        if(a[this.currentSort] > b[this.currentSort]) return 1 * modifier;
        return 0;
      });
    }
  }
}
</script>
