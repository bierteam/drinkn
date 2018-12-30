<template>
  <div class='container'>
    <nav class='level'>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Aanbiedingen</p>
          <p class='title'>{{ aanbiedingen.length }}</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Gemmiddelde korting</p>
          <p class='title'>€{{ (average(discountArray) / 100).toFixed(2) }}</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Online aanbiedingen</p>
          <p class='title'>{{ onlineAanbiedingen }}</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Nog een vakje</p>
          <p class='title'>0</p>
        </div>
      </div>
    </nav>

    <!-- debug: sort={{currentSort}}, dir={{currentSortDir}} -->
    <table class='table container'>
      <!-- <thead>
        <tr>
          <th @click='sort('brand')'>Brand</th>
          <th @click='sort('store')'>Store</th>
          <th @click='sort('sortOldPrice')'>Old price</th>
          <th @click='sort('sortNewPrice')'>New price</th>
          <th @click='sort('discount')'>Discount</th>
          <th @click='sort('discountP')'>Discount %</th>
          <th @click='sort('volume')'>Volume</th>
          <th @click='sort('uri')'>Link</th>
        </tr>
      </thead> -->
      <thead>
        <tr>
          <th><input class='input' v-model='search' type='text' placeholder='Search'></th>
          <th>
            <select class='select' v-model="store">
              <option disabled value="">Select a store</option>
              <option v-for="option in stores">
                {{ option }}
              </option>
            </select>
          </th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
        </tr>
        <tr>
          <th v-for='(key, value) in headers' @click='sort(value)'>{{ key }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for='aanbieding in filteredAanbiedingen' :key='aanbieding.id'>
          <td>{{ aanbieding.brand }}</td>
          <td>{{ aanbieding.store }} </td>
          <td class='has-text-success'>€{{ aanbieding.newPrice }}</td>
          <td class='has-text-danger'>€{{ aanbieding.oldPrice }}</td>
          <td>€{{ aanbieding.discount }}</td>
          <td>{{ aanbieding.discountP }}%</td>
          <td>{{ aanbieding.volume }}</td>
          <a class='button is-success' v-if='aanbieding.uri' :href='aanbieding.uri'>Buy!</a>
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
      discountArray: [],
      onlineAanbiedingen: 0,
      search: '',
      store: '',
      stores: [],
      currentSort:'',
      currentSortDir:'asc',
      headers: {
        brand: 'Brand',
        store: 'Store',
        sortNewPrice: 'New',
        sortOldPrice: 'Old',
        sortDiscount: 'Discount',
        sortDiscountP: '%',
        volume: 'Volume',
        uri: 'Link'
      }
    }
  },
  mounted () {
    this.getPils()
  },
  methods: {
    async getPils () {
      const response = await aanbiedingen.fetchPils()
      for (let i = 0; i < response.data.length; i++) {
        response.data[i].oldPrice = (response.data[i].pricing.oldPrice / 100).toFixed(2)
        response.data[i].newPrice = (response.data[i].pricing.newPrice / 100).toFixed(2)
        response.data[i].discount = ((response.data[i].pricing.oldPrice - response.data[i].pricing.newPrice) / 100).toFixed(2)
        response.data[i].discountP = (100 - (response.data[i].pricing.newPrice * 100 / response.data[i].pricing.oldPrice)).toPrecision(2)

        response.data[i].sortOldPrice = response.data[i].pricing.oldPrice
        response.data[i].sortNewPrice = response.data[i].pricing.newPrice
        response.data[i].sortDiscount = response.data[i].discount * 100
        response.data[i].sortDiscountP = response.data[i].discountP * 100
        this.discountArray.push(response.data[i].sortDiscount)
        if (response.data[i].uri){
          this.onlineAanbiedingen++
        }
        if(this.stores.indexOf(response.data[i].store) === -1) {
          this.stores.push(response.data[i].store);
        }
      }
      this.aanbiedingen = response.data
    },
    sort:function(s) {
      //if s == current sort, reverse
      if(s === this.currentSort) {
        this.currentSortDir = this.currentSortDir==='asc'?'desc':'asc'
      }
      this.currentSort = s
    },
    average:function(inputArray){
      let result = 0
      let i
      for (i = 0; i < inputArray.length; i++) {
        result += inputArray[i]
      }
      return result / i
    },
  },
  computed:{
    sortedAanbiedingen:function() {
      return this.aanbiedingen.sort((a,b) => {
        let modifier = 1
        if(this.currentSortDir === 'desc') modifier = -1
        if(a[this.currentSort] < b[this.currentSort]) return -1 * modifier
        if(a[this.currentSort] > b[this.currentSort]) return 1 * modifier
        return 0
      })
    },
    filteredAanbiedingen:function() {
      // let filteredDataByfilters = []
      let filteredDataBySearch = []
      // first check if filters where selected
      // if (this.selectedFilters.length > 0) {
      //   filteredDataByfilters= this.filteredData.filter(obj => this.selectedFilters.every(val => obj.stack.indexOf(val) >= 0))
      //   this.filteredData = filteredDataByfilters
      // }
      // then filter according to keyword, for now this only affects the name attribute of each data
      if (this.search !== '') {
        filteredDataBySearch = this.sortedAanbiedingen.filter(obj => obj.brand.toLowerCase().indexOf(this.search.toLowerCase()) >= 0)
        return this.filteredAanbiedingen = filteredDataBySearch
      }
      return this.filteredAanbiedingen = this.sortedAanbiedingen
    },
  }
}
</script>
