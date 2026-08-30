<script>
import { useDiscounts, formatPrice } from '../composables/useDiscounts'
import { mergedQuery, sameQuery } from '../composables/useQuerySync'

const filterKeys = ['search', 'store', 'volume', 'online', 'zero', 'sort', 'dir']

const sortOptions = [
  { value: 'literPrice', label: 'Price per litre' },
  { value: 'discountPercentage', label: 'Discount %' },
  { value: 'discount', label: 'Amount saved' },
  { value: 'newPrice', label: 'Price' },
  { value: 'brand', label: 'Brand' },
  { value: 'store', label: 'Store' }
]

// discount and discountPercentage arrive as toFixed()/toPrecision() strings, so
// comparing them directly puts '9.0' after '10.0'. Numeric strings are compared
// as numbers here; anything else falls back to a case-insensitive compare.
const sortValue = (item, key) => {
  const raw = item[key]
  if (typeof raw !== 'string') {
    return raw
  }
  const number = Number(raw)
  return raw.trim() !== '' && Number.isFinite(number) ? number : raw.toLowerCase()
}

// the free text box searches the three fields a visitor can actually see,
// rather than every property on the record including uris and timestamps
const searchable = ['brand', 'store', 'volume']

const matches = (item, needle) =>
  searchable.some(key => String(item[key] ?? '').toLowerCase().includes(needle))

const shortDate = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })

export default {
  name: 'Discounts',
  setup () {
    return useDiscounts()
  },
  data () {
    return {
      online: false,
      search: '',
      showFilters: false,
      sort: 'literPrice',
      sortDir: 1,
      sortOptions,
      store: '',
      volume: '',
      zero: true
    }
  },
  created () {
    this.queryTimer = null
    this.load()
  },
  computed: {
    processed () {
      const needle = this.search.trim().toLowerCase()
      const filtered = this.discounts.filter(item => {
        if (this.online && !item.uri) return false
        // the API stores the percentage times a hundred, and omits it when unknown
        const alcoholic = item.alcoholPercentage > 100
        if (!this.zero && !alcoholic) return false
        if (this.store && item.store !== this.store) return false
        if (this.volume && item.volume !== this.volume) return false
        if (needle && !matches(item, needle)) return false
        return true
      })

      const direction = this.sortDir < 0 ? -1 : 1
      return filtered.sort((a, b) => {
        const left = sortValue(a, this.sort)
        const right = sortValue(b, this.sort)
        if (left === right) return 0
        return left > right ? direction : -direction
      })
    },
    // only the filters hidden behind the toggle are counted, so the badge
    // says what is on that the visitor cannot currently see
    hiddenFilterCount () {
      return [this.store, this.volume, this.online, !this.zero].filter(Boolean).length
    },
    activeFilters () {
      return Boolean(this.search || this.hiddenFilterCount)
    },
    filterQuery () {
      const query = {}
      if (this.search) query.search = this.search
      if (this.store) query.store = this.store
      if (this.volume) query.volume = this.volume
      if (this.online) query.online = 'true'
      // zero defaults to true, so it is the off state that is worth encoding
      if (!this.zero) query.zero = 'false'
      if (this.sort !== 'literPrice') query.sort = this.sort
      if (this.sortDir !== 1) query.dir = 'desc'
      return query
    }
  },
  watch: {
    filterQuery (query) {
      clearTimeout(this.queryTimer)
      this.queryTimer = setTimeout(() => {
        const next = mergedQuery(this.$route.query, filterKeys, query)
        if (!sameQuery(next, this.$route.query)) {
          this.$router.replace({ query: next })
        }
      }, 300)
    }
  },
  mounted () {
    const query = this.$route.query
    // only override a default when the key is really in the URL: reading a
    // missing key gives undefined, which would wipe every default
    if (query.search !== undefined) this.search = query.search
    if (query.store !== undefined) this.store = query.store
    if (query.volume !== undefined) this.volume = query.volume
    if (query.online !== undefined) this.online = query.online === 'true'
    if (query.zero !== undefined) this.zero = query.zero === 'true'
    if (sortOptions.some(option => option.value === query.sort)) this.sort = query.sort
    if (query.dir !== undefined) this.sortDir = query.dir === 'desc' ? -1 : 1
    // a filter arriving from the URL is invisible while the panel is shut, and
    // desktop has the room to leave it open
    this.showFilters = this.hiddenFilterCount > 0 || window.innerWidth >= 1024
  },
  beforeUnmount () {
    clearTimeout(this.queryTimer)
  },
  methods: {
    formatPrice,
    alcohol (item) {
      return typeof item.alcoholPercentage === 'number' ? `${item.alcoholPercentage / 100}%` : null
    },
    percentage (item) {
      return Math.round(Number(item.discountPercentage))
    },
    validUntil (item) {
      if (!item.validity) return null
      const date = new Date(item.validity)
      return Number.isNaN(date.getTime()) ? null : shortDate.format(date)
    },
    sortBy (key) {
      if (key === this.sort) {
        this.sortDir = this.sortDir === 1 ? -1 : 1
        return
      }
      this.sort = key
      this.sortDir = 1
    },
    reset () {
      this.search = ''
      this.store = ''
      this.volume = ''
      this.online = false
      this.zero = true
    }
  }
}
</script>

<template>
<div class="container">
  <div class="stats mb-4">
    <div class="stat">
      <p class="heading">Discounts</p>
      <p class="stat-value">{{ discounts.length }}</p>
    </div>
    <div class="stat">
      <p class="heading">Average discount</p>
      <p class="stat-value">{{ formatPrice(averageDiscount) }}</p>
    </div>
    <div class="stat">
      <p class="heading">Average liter price</p>
      <p class="stat-value">{{ formatPrice(averageLiterPrice) }}</p>
    </div>
    <div class="stat">
      <p class="heading">Online</p>
      <p class="stat-value">{{ onlineCount }}</p>
    </div>
  </div>

  <div class="box filters has-text-left">
    <div class="field">
      <label class="is-sr-only" for="discounts-search">Search discounts</label>
      <div class="control has-icons-right">
        <input id="discounts-search" class="input" type="search" placeholder="Search brand, store or volume" v-model="search">
        <span class="icon is-small is-right" v-if="search">
          <i class="delete" @click="search = ''"></i>
        </span>
      </div>
    </div>

    <div class="field is-grouped filter-row">
      <div class="control is-expanded">
        <label class="is-sr-only" for="discounts-sort">Sort by</label>
        <div class="select is-fullwidth">
          <select id="discounts-sort" v-model="sort">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>
      <div class="control">
        <button
          type="button"
          class="button"
          :aria-label="sortDir === 1 ? 'Sort descending' : 'Sort ascending'"
          @click="sortDir = sortDir === 1 ? -1 : 1">
          {{ sortDir === 1 ? '↑ Low' : '↓ High' }}
        </button>
      </div>
      <div class="control">
        <button
          type="button"
          id="discounts-filter-toggle"
          class="button"
          :class="{ 'is-primary': hiddenFilterCount }"
          :aria-expanded="String(showFilters)"
          aria-controls="discounts-filter-panel"
          @click="showFilters = !showFilters">
          Filters<span v-if="hiddenFilterCount">&nbsp;({{ hiddenFilterCount }})</span>
        </button>
      </div>
    </div>

    <!-- the secondary filters cost a third of a phone screen, so they stay
         folded away until they are asked for -->
    <div id="discounts-filter-panel" v-show="showFilters">
      <div class="field is-grouped is-grouped-multiline filter-row">
        <div class="control is-expanded">
          <label class="is-sr-only" for="discounts-store">Store</label>
          <div class="select is-fullwidth">
            <select id="discounts-store" v-model="store">
              <option value="">All stores</option>
              <option v-for="option in stores" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
        </div>
        <div class="control is-expanded">
          <label class="is-sr-only" for="discounts-volume">Volume</label>
          <div class="select is-fullwidth">
            <select id="discounts-volume" v-model="volume">
              <option value="">All volumes</option>
              <option v-for="option in volumes" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="field is-grouped filter-row">
        <div class="control is-expanded">
          <button type="button" class="button is-fullwidth" :class="{ 'is-primary': zero }" @click="zero = !zero">
            Include 0.0
          </button>
        </div>
        <div class="control is-expanded">
          <button type="button" class="button is-fullwidth" :class="{ 'is-primary': online }" @click="online = !online">
            Online only
          </button>
        </div>
      </div>
    </div>

    <div class="is-flex is-justify-content-space-between is-align-items-center">
      <p class="is-size-7 has-text-grey">{{ processed.length }} of {{ discounts.length }} discounts</p>
      <button type="button" class="button is-small is-ghost" v-if="activeFilters" @click="reset">Clear filters</button>
    </div>
  </div>

  <progress v-if="loading" class="progress is-small"></progress>

  <p class="notification" v-else-if="!processed.length">
    Nothing matches those filters.
  </p>

  <!-- cards, up to the desktop breakpoint -->
  <div class="cards is-hidden-desktop" v-if="!loading">
    <article class="card discount-card" v-for="discount in processed" :key="discount.id">
      <div class="card-content p-4 has-text-left">
        <div class="is-flex is-justify-content-space-between is-align-items-flex-start">
          <div class="pr-3">
            <p class="title is-5 mb-1">{{ discount.brand }}</p>
            <p class="is-size-7 has-text-grey">
              {{ discount.volume }}<template v-if="alcohol(discount)"> · {{ alcohol(discount) }}</template>
              <template v-if="validUntil(discount)"> · until {{ validUntil(discount) }}</template>
            </p>
          </div>
          <div class="has-text-right is-flex-shrink-0">
            <p class="title is-4 mb-1 has-text-success">{{ formatPrice(discount.newPrice / 100) }}</p>
            <p class="is-size-7 has-text-grey"><s>{{ formatPrice(discount.oldPrice / 100) }}</s></p>
          </div>
        </div>

        <div class="tags mt-3 mb-0">
          <span class="tag is-info is-light">{{ formatPrice(discount.literPrice) }} / liter</span>
          <span class="tag is-success is-light">-{{ percentage(discount) }}%</span>
          <span class="tag">save {{ formatPrice(discount.discount) }}</span>
          <button type="button" class="tag is-clickable" @click="store = discount.store">{{ discount.store }}</button>
        </div>

        <a
          class="button is-primary is-fullwidth mt-3"
          v-if="discount.uri"
          target="_blank"
          rel="noopener noreferrer"
          :href="discount.uri">Buy!</a>
      </div>
    </article>
  </div>

  <!-- the table stays for screens that have the room for it -->
  <div class="table-container is-hidden-touch" v-if="!loading && processed.length">
    <table class="table is-fullwidth is-hoverable">
      <caption class="is-sr-only">Table of beer discounts</caption>
      <thead>
        <tr>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('brand')">Brand</button></th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('store')">Store</button></th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('newPrice')">New</button></th>
          <th>Old</th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('literPrice')">Liter</button></th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('discount')">Discount</button></th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('discountPercentage')">%</button></th>
          <th>Volume</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="discount in processed" :key="discount.id">
          <td>{{ discount.brand }}</td>
          <td>{{ discount.store }}</td>
          <td class="has-text-success">{{ formatPrice(discount.newPrice / 100) }}</td>
          <td class="has-text-grey"><s>{{ formatPrice(discount.oldPrice / 100) }}</s></td>
          <td>{{ formatPrice(discount.literPrice) }}</td>
          <td>{{ formatPrice(discount.discount) }}</td>
          <td>-{{ percentage(discount) }}%</td>
          <td>{{ discount.volume }}</td>
          <td>
            <a class="button is-primary is-small" v-if="discount.uri" target="_blank" rel="noopener noreferrer" :href="discount.uri">Buy!</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<style scoped>
/* the sortable headers are ghost buttons and the rest are plain text; matching
   their metrics keeps the header row from looking ragged, while the link colour
   still marks which ones can be clicked */
.table thead th {
  font-size: 0.75rem;
  font-weight: 600;
  vertical-align: middle;
}

.table thead th .button {
  font-size: 0.75rem;
  font-weight: 600;
  height: auto;
  padding: 0;
}
/* four stats across a phone costs half the first screen, so they sit two by
   two and only spread out once there is room */
.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

/* bulma 1.x dropped the .heading styles the old page relied on, so the label
   rendered larger than the figure it labels */
.stat .heading {
  color: var(--bulma-text-weak, #7a7a7a);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  line-height: 1.3;
  margin-bottom: 0.1rem;
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.2;
}

.filters {
  padding: 1rem;
}

.filter-row {
  margin-bottom: 0.75rem;
}

.cards {
  display: grid;
  gap: 0.75rem;
}

.discount-card .tags {
  gap: 0.375rem;
}

@media screen and (min-width: 769px) {
  .stats {
    grid-template-columns: repeat(4, 1fr);
  }

  .stat-value {
    font-size: 1.75rem;
  }
}
</style>
