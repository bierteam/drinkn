<script>
import { useProducts, formatCents, discountPercentage } from '../composables/useProducts'

const sortOptions = [
  { value: 'literPrice', label: 'Price per litre' },
  { value: 'price', label: 'Price' },
  { value: 'brand', label: 'Brand' },
  { value: 'store', label: 'Store' }
]

export default {
  name: 'Products',
  setup () {
    return useProducts()
  },
  data () {
    return {
      search: '',
      store: '',
      onlyDiscounted: false,
      sort: 'literPrice',
      dir: 'asc',
      page: 0,
      sortOptions,
      searchTimer: null
    }
  },
  created () {
    this.refresh()
    this.loadFacets()
  },
  computed: {
    query () {
      const query = { page: this.page, sort: this.sort, dir: this.dir }
      if (this.search) query.search = this.search
      if (this.store) query.store = this.store
      if (this.onlyDiscounted) query.onlyDiscounted = 'true'
      return query
    }
  },
  watch: {
    // a keystroke per request would put one request per character on the API
    search () { this.debounced() },
    store () { this.resetAndRefresh() },
    onlyDiscounted () { this.resetAndRefresh() },
    sort () { this.resetAndRefresh() },
    dir () { this.resetAndRefresh() }
  },
  beforeUnmount () {
    clearTimeout(this.searchTimer)
  },
  methods: {
    formatCents,
    discountPercentage,
    refresh () {
      this.load(this.query)
    },
    resetAndRefresh () {
      this.page = 0
      this.refresh()
    },
    debounced () {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.resetAndRefresh(), 300)
    },
    turnTo (page) {
      this.page = page
      this.refresh()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    validUntil (item) {
      if (!item.discount?.endsAt) return null
      return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })
        .format(new Date(item.discount.endsAt))
    }
  }
}
</script>

<template>
<div class="container">
  <div class="stats mb-4">
    <div class="stat">
      <p class="heading">Products</p>
      <p class="stat-value">{{ facets.total }}</p>
    </div>
    <div class="stat">
      <p class="heading">On offer</p>
      <p class="stat-value">{{ facets.discounted }}</p>
    </div>
    <div class="stat">
      <p class="heading">Stores</p>
      <p class="stat-value">{{ facets.stores.length }}</p>
    </div>
    <div class="stat">
      <p class="heading">Matching</p>
      <p class="stat-value">{{ total }}</p>
    </div>
  </div>

  <div class="box filters has-text-left">
    <div class="field">
      <label class="is-sr-only" for="products-search">Search products</label>
      <div class="control">
        <input id="products-search" class="input" type="search" placeholder="Search brand or volume" v-model="search">
      </div>
    </div>

    <div class="field is-grouped filter-row">
      <div class="control is-expanded">
        <label class="is-sr-only" for="products-store">Store</label>
        <div class="select is-fullwidth">
          <select id="products-store" v-model="store">
            <option value="">All stores</option>
            <option v-for="name in facets.stores" :key="name" :value="name">{{ name }}</option>
          </select>
        </div>
      </div>
      <div class="control is-expanded">
        <label class="is-sr-only" for="products-sort">Sort by</label>
        <div class="select is-fullwidth">
          <select id="products-sort" v-model="sort">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>
      <div class="control">
        <button type="button" class="button" @click="dir = dir === 'asc' ? 'desc' : 'asc'">
          {{ dir === 'asc' ? '↑ Low' : '↓ High' }}
        </button>
      </div>
    </div>

    <div class="field">
      <label class="checkbox">
        <input type="checkbox" v-model="onlyDiscounted"> Only show current offers
      </label>
    </div>
  </div>

  <p v-if="error" class="notification is-danger is-light">{{ error }}</p>
  <p v-else-if="loading" class="has-text-grey">Loading…</p>
  <p v-else-if="!products.length" class="has-text-grey">No products match those filters.</p>

  <table v-else class="table is-fullwidth is-striped">
    <thead>
      <tr>
        <th>Brand</th>
        <th>Volume</th>
        <th>Store</th>
        <th>Price</th>
        <th>Per litre</th>
        <th>Offer</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in products" :key="item._id">
        <td>
          <a v-if="item.uri" :href="item.uri" target="_blank" rel="noopener noreferrer">{{ item.title || item.brand }}</a>
          <span v-else>{{ item.title || item.brand }}</span>
        </td>
        <td>{{ item.volume }}</td>
        <td>{{ item.store }}</td>
        <td>
          <span class="has-text-weight-semibold">{{ formatCents(item.price.current) }}</span>
          <s v-if="item.price.base" class="has-text-grey is-size-7">&nbsp;{{ formatCents(item.price.base) }}</s>
        </td>
        <!-- blank rather than zero: a product with no published volume has no
             litre price, and 0 would read as free -->
        <td>{{ formatCents(item.price.literPrice) ?? '—' }}</td>
        <td>
          <span v-if="item.isDiscounted" class="tag is-success is-light">
            -{{ discountPercentage(item) ?? '' }}{{ discountPercentage(item) ? '%' : 'offer' }}
            <template v-if="validUntil(item)">&nbsp;· till {{ validUntil(item) }}</template>
          </span>
        </td>
      </tr>
    </tbody>
  </table>

  <nav class="pagination is-centered" role="navigation" aria-label="pagination" v-if="totalPages > 1">
    <button class="pagination-previous" :disabled="page === 0" @click="turnTo(page - 1)">Previous</button>
    <button class="pagination-next" :disabled="page >= totalPages - 1" @click="turnTo(page + 1)">Next</button>
    <ul class="pagination-list">
      <li><span class="pagination-link is-current">{{ page + 1 }} / {{ totalPages }}</span></li>
    </ul>
  </nav>
</div>
</template>
