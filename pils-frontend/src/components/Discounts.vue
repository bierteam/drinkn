<template>
  <div class='container'>
    <nav class='level'>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Discounts</p>
          <p class='title'>{{ discounts.length}}</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Average discount</p>
          <p class='title'>{{ average(discountAverage) | currency }} & {{ Math.round(average(percentageAverage)) }}%</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Average liter price</p>
          <p class='title'>{{ average(literAverage) | currency }}</p>
        </div>
      </div>
      <div class='level-item has-text-centered'>
        <div>
          <p class='heading'>Online Discounts</p>
          <p class='title'>{{ onlineCounter }}</p>
        </div>
      </div>
    </nav>
    <progress v-if="discounts.length === 0" class="progress is-small"></progress>
    <table class='table container'>
      <thead>
        <tr><!-- first row -->
          <th><input class='input' v-model='search' type='text' placeholder='Search' autofocus></th>
          <th><input type="checkbox" v-model="zero" @click='zero = !zero'></th>
          <th>
            <div class="select">
              <select v-model="store">
                <option value="">Select a store</option>
                <option v-for="option in stores" :key='option'>
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
                <option value="">Select a volume</option>
                <option v-for="option in volumes" :key='option'>
                  {{ option }}
                </option>
              </select>
            </div>
          </th>
          <th><input type="checkbox" v-model="online" @click='online = !online'></th>
        </tr>
        <tr><!-- second row -->
          <th v-for='(key, value) in headers' @click='toggleSort(value)' :key='value'>{{ key }}</th>
          <th @click='online = !online'>Link</th>
        </tr>
      </thead>
      <tfoot>
        <tr><!-- bottom row -->
          <th v-for='(key, value) in headers' @click='toggleSort(value)' :key='value'>{{ key }}</th>
          <th @click='online = !online'>Link</th>
        </tr>
      </tfoot>
      <tbody><!-- table -->
        <tr v-for='discount in processed' :key='discount.id'>
          <td @click='search = discount.brand'>{{ discount.brand }}</td>
          <td>{{ discount.alcoholPercentage / 100 }}%</td>
          <td @click='store = discount.store'>{{ discount.store }} </td>
          <td class='has-text-success'>{{ discount.newPrice / 100 | currency }}</td>
          <td class='has-text-danger'>{{ discount.oldPrice / 100 | currency }}</td>
          <td>{{ discount.literPrice | currency }}</td>
          <td>{{ discount.discount | currency }}</td>
          <td>{{ discount.discountPercentage }}%</td>
          <td @click='volume = discount.volume'>{{ discount.volume }}</td>
          <a class='button is-primary' v-if='discount.uri' target="_blank" rel="noopener noreferrer" :href='discount.uri'>Buy!</a>
          <a v-else></a>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import Api from '@/services/Api'
import Vue2Filters from 'vue2-filters'

export default {
  mixins: [Vue2Filters.mixin],
  data () {
    return {
      discounts: [],
      discountAverage: [],
      literAverage: [],
      percentageAverage: [],
      onlineCounter: 0,
      search: '',
      online: false,
      zero: true,
      store: '',
      stores: [],
      volume: '',
      volumes: [],
      sort:'literPrice',
      sortDir: 1,
      headers: {
        brand: 'Brand',
        alcoholPercentage: '%',
        store: 'Store',
        newPrice: 'New',
        oldPrice: 'Old',
        literPrice: 'Liter',
        discount: 'Discount',
        discountPercentage: '%',
        volume: 'Volume'
      }
    }
  },
  created () {
    this.getPils()
  },
  methods: {
    async getPils () {
      const response = await Api().get('/api/v1/discounts')
      for (let i = 0; i < response.data.length; i++) {
        // take data to main object for sorting
        response.data[i].discount = ((response.data[i].pricing.oldPrice - response.data[i].pricing.newPrice) / 100).toFixed(2)
        response.data[i].discountPercentage = (100 - (response.data[i].pricing.newPrice * 100 / response.data[i].pricing.oldPrice)).toPrecision(2)
        // response.data[i].literPrice = response.data[i].pricing.literPrice
        response.data[i].literPrice = response.data[i].pricing.newPrice / response.data[i].liter * 10 // Temporary
        response.data[i].newPrice = response.data[i].pricing.newPrice
        response.data[i].oldPrice = response.data[i].pricing.oldPrice

        this.discountAverage.push(response.data[i].discount)
        this.percentageAverage.push(response.data[i].discountPercentage)
        this.literAverage.push(response.data[i].literPrice)
        if (response.data[i].uri){ this.onlineCounter++ }
        if(this.stores.indexOf(response.data[i].store) === -1) {this.stores.push(response.data[i].store)}
        if(this.volumes.indexOf(response.data[i].volume) === -1) {this.volumes.push(response.data[i].volume)}
      }
      this.discounts = response.data
      this.volumes.sort()
    },
    toggleSort:function(input) {
      if(input === this.sort) {
        this.sortDir = this.sortDir === 1 ? -1 : 1
      }
      this.sort = input
    },
    average:function(inputArray){
      let result = 0
      for (let i = 0; i < inputArray.length; i++) {
        result += Number(inputArray[i]) // x += y same as x = x + y
      }
      return result / inputArray.length
    }
  },
  computed:{
    processed:function() {
      let data = this.discounts
      data = this.orderBy(this.discounts, this.sort, this.sortDir)
      if (this.online) { data = data.filter(obj => obj.uri) }
      if (!this.zero) { data = data.filter(obj => obj.alcoholPercentage > 100) }
      data = this.filterBy(data, this.search)
      data = this.filterBy(data, this.store)
      data = this.filterBy(data, this.volume)
      return data
    }
  },
  updated () {
    const query = {}
    if (this.search) query.search = this.search
    if (this.store) query.store = this.store
    if (this.volume) query.volume = this.volume
    if (this.online) query.online = this.online
    if (this.zero) query.zero = this.zero
    this.$router.replace({query})
  },
  mounted () {
    this.search = this.$route.query.search
    this.store = this.$route.query.store
    this.volume = this.$route.query.volume
    this.online = this.$route.query.online
    this.zero = this.$route.query.zero
  },
}
</script>
