<script>
import Api from '../services/Api'
import Vue2Filters from 'vue2-filters'
import { getCachedData, setCachedData } from '../services/db'
import { toRaw } from 'vue'

const filterKeys = ['search', 'store', 'volume', 'online', 'zero']

// shallow, order-insensitive compare so we skip redundant router navigations
const sameQuery = (a, b) => {
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  return aKeys.length === bKeys.length
    && aKeys.every((key, index) => key === bKeys[index] && String(a[key]) === String(b[key]))
}

export default {
  mixins: [Vue2Filters.mixin],
  data () {
    return {
      discountAverage: [],
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
      literAverage: [],
      online: false,
      onlineCounter: 0,
      percentageAverage: [],
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
  created () {
    this.queryTimer = null
    this.cache()
  },
  methods: {
    async getPils () {
      const response = await Api().get('/api/v1/discounts')
      const discountAverage = []
      const percentageAverage = []
      const literAverage = []
      const stores = []
      const volumes = []
      let onlineCounter = 0

      for (const item of response.data) {
        // take data to main object for sorting
        item.discount = ((item.pricing.oldPrice - item.pricing.newPrice) / 100).toFixed(2)
        item.discountPercentage = (100 - (item.pricing.newPrice * 100 / item.pricing.oldPrice)).toPrecision(2)
        item.literPrice = item.pricing.literPrice
        item.newPrice = item.pricing.newPrice
        item.oldPrice = item.pricing.oldPrice

        discountAverage.push(item.discount)
        percentageAverage.push(item.discountPercentage)
        literAverage.push(item.literPrice)
        if (item.uri) {
          onlineCounter++
        }
        if (stores.indexOf(item.store) === -1) {
          stores.push(item.store)
        }
        if (volumes.indexOf(item.volume) === -1) {
          volumes.push(item.volume)
        }
      }
      volumes.sort()

      // assign in one go so a re-run replaces the previous totals instead of
      // adding to them, which would double-count anything restored from cache
      this.discountAverage = discountAverage
      this.percentageAverage = percentageAverage
      this.literAverage = literAverage
      this.onlineCounter = onlineCounter
      this.stores = stores
      this.volumes = volumes
      this.discounts = response.data
    },
    async cache () {
      const cachekeys = ['discounts', 'onlineCounter', 'literAverage', 'discountAverage', 'percentageAverage', 'stores', 'volumes']
      // the cache is an enhancement: if it is unavailable we still fetch
      try {
        for (const cacheKey of cachekeys) {
          const cached = await getCachedData(cacheKey)
          if (cached) {
            this[cacheKey] = cached
          }
        }
      } catch (error) {
        console.warn('Could not read cached discounts:', error)
      }

      await this.getPils()

      try {
        for (const cacheKey of cachekeys) {
          const plainClone = structuredClone(toRaw(this[cacheKey]))
          await setCachedData(cacheKey, plainClone)
        }
      } catch (error) {
        console.warn('Could not cache discounts:', error)
      }
    },
    toggleSort: function (input) {
      if (input === this.sort) {
        this.sortDir = this.sortDir === 1 ? -1 : 1
      }
      this.sort = input
    },
    average: function (inputArray) {
      if (!inputArray.length) {
        return 0
      }
      let result = 0
      for (const item of inputArray) {
        result += Number(item)
      }
      return result / inputArray.length
    },
    formatPrice: function (value) {
      const number = Number(value)
      if (value === null || value === '' || !Number.isFinite(number)) {
        return value
      }
      const formatter = new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR'
      })
      return formatter.format(number)
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
    },
    filterQuery: function () {
      const query = {}
      if (this.search) query.search = this.search
      if (this.store) query.store = this.store
      if (this.volume) query.volume = this.volume
      if (this.online) query.online = String(this.online)
      // zero defaults to true, so it is the off state that is worth encoding
      if (!this.zero) query.zero = 'false'
      return query
    }
  },
  watch: {
    // sync the active filters into the URL. this used to live in updated(),
    // which fired on every render and navigated on every keystroke
    filterQuery (query) {
      clearTimeout(this.queryTimer)
      this.queryTimer = setTimeout(() => {
        const next = { ...this.$route.query }
        for (const key of filterKeys) {
          delete next[key]
        }
        Object.assign(next, query)
        if (!sameQuery(next, this.$route.query)) {
          this.$router.replace({ query: next })
        }
      }, 300)
    }
  },
  mounted () {
    const query = this.$route.query
    // only override a default when the key is really in the URL: reading a
    // missing key gives undefined, which used to wipe every default
    if (query.search !== undefined) this.search = query.search
    if (query.store !== undefined) this.store = query.store
    if (query.volume !== undefined) this.volume = query.volume
    if (query.online !== undefined) this.online = query.online === 'true'
    if (query.zero !== undefined) this.zero = query.zero === 'true'
  },
  beforeUnmount () {
    clearTimeout(this.queryTimer)
  }
}
</script>

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
              <button class="button" aria-haspopup="true" aria-controls="dropdown-store">
                <div @click='store = null'>{{ store || "Select a store" }}</div>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-store" role="menu">
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
              <button class="button" aria-haspopup="true" aria-controls="dropdown-volume">
                <div @click='volume = null'>{{ volume || "Select a Volume" }}</div>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-volume" role="menu">
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
        <td>
          <a class='button is-primary' v-if='discount.uri' target="_blank" rel="noopener noreferrer" :href='discount.uri'>Buy!</a>
        </td>
      </tr>
    </tbody>
  </table>
</div>
</template>
