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
        <p class='title'>{{ formatPrice(average(discountAverage)) }} & {{ Math.round(average(percentageAverage)) }}%</p>
      </div>
    </div>
    <div class='level-item has-text-centered'>
      <div>
        <p class='heading'>Average liter price</p>
        <p class='title'>{{ formatPrice(average(literAverage)) }}</p>
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
    <caption class='is-hidden'>Table of beer discounts</caption>
    <thead>
      <tr>
        <!-- first row -->
        <th>
          <div class="control has-icons-right">
            <input class='input' type='text' placeholder='Search' v-model="search" autofocus>
            <span class="icon is-small is-right">
              <i class="delete" :class="{'is-hidden': !search }" @click='search = null'></i>
            </span>
          </div>
        </th>
        <th>
          <button class="button" :class="{'is-primary': zero }" @click='zero = !zero'>0.0</button>
        </th>
        <th>
          <div class="dropdown is-hoverable">
            <div class="dropdown-trigger">
              <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                <div @click='store = null'>{{ store || "Select a store" }}</div>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu" role="menu">
              <div class="dropdown-content" v-for="option in stores" :key='option'>
                <a class="dropdown-item" @click='store = option'>{{ option }}</a>
              </div>
            </div>
          </div>
        </th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th>
          <div class="dropdown is-hoverable">
            <div class="dropdown-trigger">
              <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                <div @click='volume = null'>{{ volume || "Select a Volume" }}</div>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu" role="menu">
              <div class="dropdown-content" v-for="option in volumes" :key='option'>
                <a class="dropdown-item" @click='volume = option'>{{ option }}</a>
              </div>
            </div>
          </div>
        </th>
        <th>
          <button class="button" :class="{'is-primary': online }" @click='online = !online'>Online</button>
        </th>
      </tr>
      <tr>
        <!-- second row -->
        <th v-for='(key, value) in headers' @click='toggleSort(value)' :key='value'>{{ key }}</th>
      </tr>
    </thead>
    <tfoot>
      <tr>
        <!-- bottom row -->
        <th v-for='(key, value) in headers' @click='toggleSort(value)' :key='value'>{{ key }}</th>
      </tr>
    </tfoot>
    <tbody>
      <!-- table -->
      <tr v-for='discount in processed' :key='discount.id'>
        <td @click='search = discount.brand'>{{ discount.brand }}</td>
        <td>{{ discount.alcoholPercentage / 100 }}%</td>
        <td @click='store = discount.store'>{{ discount.store }} </td>
        <td class='has-text-success'>{{ formatPrice(discount.newPrice / 100) }}</td>
        <td class='has-text-danger'>{{ formatPrice(discount.oldPrice / 100) }}</td>
        <td>{{ formatPrice(discount.literPrice) }}</td>
        <td>{{ formatPrice(discount.discount) }}</td>
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
import Api from '/src/services/Api'
import Vue2Filters from 'vue2-filters'

export default {
  mixins: [Vue2Filters.mixin],
  data() {
    return {
      discountAverage: [0],
      discounts: [],
      headers: {
        brand: 'Brand',
        alcoholPercentage: '%',
        store: 'Store',
        newPrice: 'New',
        oldPrice: 'Old',
        literPrice: 'Liter',
        discount: 'Discount',
        discountPercentage: '%',
        volume: 'Volume',
        uri: 'Link'
      },
      literAverage: [0],
      online: false,
      onlineCounter: 0,
      percentageAverage: [0],
      search: '',
      sort: 'literPrice',
      sortDir: 1,
      store: '',
      stores: [],
      volume: '',
      volumes: [],
      zero: true
    }
  },
  created() {
    this.getPils()
  },
  methods: {
    async getPils() {
      const response = await Api().get('/api/v1/discounts')
      for (const item of response.data) {
        // take data to main object for sorting
        item.discount = ((item.pricing.oldPrice - item.pricing.newPrice) / 100).toFixed(2)
        item.discountPercentage = (100 - (item.pricing.newPrice * 100 / item.pricing.oldPrice)).toPrecision(2)
        item.literPrice = item.pricing.newPrice / item.liter * 10
        item.newPrice = item.pricing.newPrice
        item.oldPrice = item.pricing.oldPrice

        this.discountAverage.push(item.discount)
        this.percentageAverage.push(item.discountPercentage)
        this.literAverage.push(item.literPrice)
        if (item.uri) {
          this.onlineCounter++
        }
        if (this.stores.indexOf(item.store) === -1) {
          this.stores.push(item.store)
        }
        if (this.volumes.indexOf(item.volume) === -1) {
          this.volumes.push(item.volume)
        }
      }

      this.discounts = response.data
      this.volumes.sort()
    },
    toggleSort: function (input) {
      if (input === this.sort) {
        this.sortDir = this.sortDir === 1 ? -1 : 1
      }
      this.sort = input
    },
    average: function (inputArray) {
      let result = 0
      for (const item of inputArray) {
        result += Number(item)
      }
      return result / inputArray.length
    },
    formatPrice: function (value) {
      if (typeof value !== "number") {
          return value
      }
      const formatter = new Intl.NumberFormat('nl-NL', {
          style: 'currency',
          currency: 'EUR'
      })
      return formatter.format(value)
    }
  },
  computed: {
    processed: function () {
      let data = this.orderBy(this.discounts, this.sort, this.sortDir)
      if (this.online) {
        data = data.filter(obj => obj.uri)
      }
      if (!this.zero) {
        data = data.filter(obj => obj.alcoholPercentage > 100)
      }
      data = this.filterBy(data, this.search)
      data = this.filterBy(data, this.store)
      data = this.filterBy(data, this.volume)
      return data
    }
  },
  updated() {
    const query = {}
    if (this.search) query.search = this.search
    if (this.store) query.store = this.store
    if (this.volume) query.volume = this.volume
    if (this.online) query.online = this.online
    if (this.zero) query.zero = this.zero
    this.$router.replace({
      query
    })
  },
  mounted() {
    this.search = this.$route.query.search
    this.store = this.$route.query.store
    this.volume = this.$route.query.volume
    this.online = this.$route.query.online
    this.zero = this.$route.query.zero
  },
}
</script>
