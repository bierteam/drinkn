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
          <p class='heading'>Gemiddelde korting</p>
          <p class='title'>€{{ (average(discountArray) / 100).toFixed(2) }}</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Gemiddelde literprijs</p>
          <p class='title'>€{{ (average(literArray) / 100).toFixed(2) }}</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Online aanbiedingen</p>
          <p class='title'>{{ onlineAanbiedingen }}</p>
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
        <!-- first row -->
        <tr>
          <th><input class='input' v-model='search' type='text' placeholder='Search'></th>
          <th>
            <div class="select">
              <select v-model="store">
                <option disabled value="">Select a store</option>
                <option v-for="option in stores">
                  {{ option }}
                </option>
              </select>
            </div>
          </th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th></th>
          <th>
            <div class="select">
              <select class='select' v-model="volume">
                <option disabled value="">Select a volume</option>
                <option v-for="option in volumes">
                  {{ option }}
                </option>
              </select>
            </div>
          </th>
          <th></th>
        </tr>
        <!-- second row -->
        <tr>
          <th v-for='(key, value) in headers' @click='sort(value)'>{{ key }}</th>
          <th v-model="checked" @click='check("checked")'>Link</th>
        </tr>
      </thead>
      <tfoot>
        <tr>
          <th v-for='(key, value) in headers' @click='sort(value)'>{{ key }}</th>
          <th v-model="checked" @click='check("checked")'>Link</th>
        </tr>
      </tfoot>
      <tbody>
        <!-- table -->
        <tr v-for='aanbieding in filteredAanbiedingen' :key='aanbieding.id'>
          <td>{{ aanbieding.brand }}</td>
          <td>{{ aanbieding.store }} </td>
          <td class='has-text-success'>€{{ aanbieding.newPrice }}</td>
          <td class='has-text-danger'>€{{ aanbieding.oldPrice }}</td>
          <td>€{{ aanbieding.literPrice }}</td>
          <td>€{{ aanbieding.discount }}</td>
          <td>{{ aanbieding.discountP }}%</td>
          <td>{{ aanbieding.volume }}</td>
          <a class='button is-primary' v-if='aanbieding.uri' :href='aanbieding.uri'>Buy!</a>
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
      literArray: [],
      onlineAanbiedingen: 0,
      search: '',
      checked: false,
      store: '',
      stores: [],
      volume: '',
      volumes: [],
      currentSort:'sortLiterPrice',
      currentSortDir:'asc',
      headers: {
        brand: 'Brand',
        store: 'Store',
        sortNewPrice: 'New',
        sortOldPrice: 'Old',
        sortLiterPrice: 'Liter',
        sortDiscount: 'Discount',
        sortDiscountP: '%',
        volume: 'Volume'
      }
    }
  },
  mounted () {
    this.getPils()
  },
  methods: {
    async getPils () {
      const response = await aanbiedingen.fetchPils()
      if (response.data == 'forbidden') {
        this.$router.push('/login')
      }
      for (let i = 0; i < response.data.length; i++) {
        response.data[i].oldPrice = (response.data[i].pricing.oldPrice / 100).toFixed(2)
        response.data[i].newPrice = (response.data[i].pricing.newPrice / 100).toFixed(2)
        response.data[i].literPrice = (response.data[i].pricing.literPrice / 100).toFixed(2)
        response.data[i].discount = ((response.data[i].pricing.oldPrice - response.data[i].pricing.newPrice) / 100).toFixed(2)
        response.data[i].discountP = (100 - (response.data[i].pricing.newPrice * 100 / response.data[i].pricing.oldPrice)).toPrecision(2)

        response.data[i].sortOldPrice = response.data[i].pricing.oldPrice
        response.data[i].sortNewPrice = response.data[i].pricing.newPrice
        response.data[i].sortLiterPrice = response.data[i].pricing.literPrice
        response.data[i].sortDiscount = response.data[i].discount * 100
        response.data[i].sortDiscountP = response.data[i].discountP * 100
        this.discountArray.push(response.data[i].sortDiscount)
        this.literArray.push(response.data[i].sortLiterPrice)
        if (response.data[i].uri){
          this.onlineAanbiedingen++
        }
        if(this.stores.indexOf(response.data[i].store) === -1) {
          this.stores.push(response.data[i].store);
        }
        if(this.volumes.indexOf(response.data[i].volume) === -1) {
          this.volumes.push(response.data[i].volume);
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
      // calculate avarage of received array
      let result = 0
      let i
      for (i = 0; i < inputArray.length; i++) {
        result += inputArray[i]
      }
      return result / i
    },
    check:function(obj){
      // toggle supplied variable
      this[obj] = !this[obj];
    }
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
      let filteredDataByfilters = []
      let filteredDataBySearch = []
      if (this.checked) {
        // TODO this is not yet functional; wizard required
        filteredDataByfilters = this.sortedAanbiedingen.filter(obj => obj.uri >= 0)
        return this.filteredAanbiedingen = filteredDataByfilters
      }
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
