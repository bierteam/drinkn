<script>
import Api from '../services/Api'
import { mergedQuery, sameQuery } from '../composables/useQuerySync'

const filterKeys = ['search', 'context', 'type', 'sort', 'dir']

const sortOptions = [
  { value: 'date', label: 'Date' },
  { value: 'type', label: 'Type' },
  { value: 'context', label: 'Context' },
  { value: 'ip', label: 'IP' }
]

const sortValue = (item, key) => {
  if (key === 'date') {
    const time = new Date(item.date).getTime()
    // an unparseable date sorts as the oldest rather than poisoning the compare
    return Number.isNaN(time) ? 0 : time
  }
  const raw = item[key]
  return typeof raw === 'string' ? raw.toLowerCase() : raw
}

// the free text box searches the fields a visitor can actually see
const searchable = ['message', 'context', 'type', 'ip']

const matches = (item, needle) =>
  searchable.some(key => String(item[key] ?? '').toLowerCase().includes(needle))

const typeClasses = {
  error: 'is-danger',
  warning: 'is-warning',
  info: 'is-info'
}

const stamp = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short' })

export default {
  name: 'Logging',
  data () {
    return {
      context: '',
      ip: '',
      logs: [],
      message: '',
      search: '',
      showFilters: false,
      sort: 'date',
      sortDir: -1,
      sortOptions,
      state: {
        deleteMsg: false
      },
      type: ''
    }
  },
  created () {
    this.queryTimer = null
  },
  computed: {
    // derived rather than accumulated: the old version pushed into arrays it
    // never cleared, so a second load listed every context twice
    contexts () {
      return [...new Set(this.logs.map(log => log.context))].filter(Boolean).sort()
    },
    types () {
      return [...new Set(this.logs.map(log => log.type))].filter(Boolean).sort()
    },
    processed () {
      const needle = this.search.trim().toLowerCase()
      const filtered = this.logs.filter(log => {
        if (this.context && log.context !== this.context) return false
        if (this.type && log.type !== this.type) return false
        if (needle && !matches(log, needle)) return false
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
      return [this.context, this.type].filter(Boolean).length
    },
    activeFilters () {
      return Boolean(this.search || this.hiddenFilterCount)
    },
    filterQuery () {
      const query = {}
      if (this.search) query.search = this.search
      if (this.context) query.context = this.context
      if (this.type) query.type = this.type
      if (this.sort !== 'date') query.sort = this.sort
      if (this.sortDir !== -1) query.dir = 'asc'
      return query
    }
  },
  watch: {
    // this used to live in updated(), which fired on every render and so
    // navigated on every keystroke
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
    this.getLogs()
    const query = this.$route.query
    // only override a default when the key is really in the URL
    if (query.search !== undefined) this.search = query.search
    if (query.context !== undefined) this.context = query.context
    if (query.type !== undefined) this.type = query.type
    if (sortOptions.some(option => option.value === query.sort)) this.sort = query.sort
    if (query.dir !== undefined) this.sortDir = query.dir === 'asc' ? 1 : -1
    // a filter arriving from the URL is invisible while the panel is shut, and
    // desktop has the room to leave it open
    this.showFilters = this.hiddenFilterCount > 0 || window.innerWidth >= 1024
  },
  beforeUnmount () {
    clearTimeout(this.queryTimer)
  },
  methods: {
    async getLogs () {
      try {
        const response = await Api().get('/api/v1/logging')
        this.logs = response.data
      } catch (error) {
        console.error('Error fetching logs:', error)
      }
    },
    async deleteLogs () {
      try {
        const response = await Api().delete('/api/v1/logging')
        this.message = response.data
        this.logs = []
      } catch (error) {
        console.error('Error deleting logs:', error)
      }
    },
    formatDate (value) {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value ?? '') : stamp.format(date)
    },
    typeClass (log) {
      return typeClasses[String(log.type ?? '').toLowerCase()] ?? ''
    },
    // the old version appended an ellipsis to every message, however short
    truncate (value, length = 80) {
      const text = String(value ?? '')
      return text.length > length ? `${text.slice(0, length)}…` : text
    },
    sortBy (key) {
      if (key === this.sort) {
        this.sortDir = this.sortDir === 1 ? -1 : 1
        return
      }
      this.sort = key
      this.sortDir = key === 'date' ? -1 : 1
    },
    reset () {
      this.search = ''
      this.context = ''
      this.type = ''
    }
  }
}
</script>

<template>
<div class="container">
  <div v-if="message" class="notification is-danger">
    <button type="button" class="delete" @click="message = ''"></button>
    {{ message }}
  </div>

  <!-- this sat inside a <tr>, where the browser hoisted it out of the table -->
  <div v-if="state.deleteMsg" class="notification is-light has-text-left">
    <button type="button" class="delete" @click="state.deleteMsg = false"></button>
    Are you sure? This is permanent.
    <br><br>
    <button class="button is-danger" @click.once="deleteLogs" type="button">I am sure!</button>
  </div>

  <div class="box filters has-text-left">
    <div class="field">
      <label class="is-sr-only" for="logging-search">Search logs</label>
      <div class="control has-icons-right">
        <input id="logging-search" class="input" type="search" placeholder="Search message, context, type or IP" v-model="search">
        <span class="icon is-small is-right" v-if="search">
          <i class="delete" @click="search = ''"></i>
        </span>
      </div>
    </div>

    <div class="field is-grouped filter-row">
      <div class="control is-expanded">
        <label class="is-sr-only" for="logging-sort">Sort by</label>
        <div class="select is-fullwidth">
          <select id="logging-sort" v-model="sort">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </div>
      <div class="control">
        <button
          type="button"
          class="button"
          :aria-label="sortDir === -1 ? 'Sort ascending' : 'Sort descending'"
          @click="sortDir = sortDir === 1 ? -1 : 1">
          {{ sortDir === -1 ? '↓ Newest' : '↑ Oldest' }}
        </button>
      </div>
      <div class="control">
        <button
          type="button"
          id="logging-filter-toggle"
          class="button"
          :class="{ 'is-primary': hiddenFilterCount }"
          :aria-expanded="String(showFilters)"
          aria-controls="logging-filter-panel"
          @click="showFilters = !showFilters">
          Filters<span v-if="hiddenFilterCount">&nbsp;({{ hiddenFilterCount }})</span>
        </button>
      </div>
    </div>

    <!-- the secondary filters cost a third of a phone screen, so they stay
         folded away until they are asked for -->
    <div id="logging-filter-panel" v-show="showFilters">
      <div class="field is-grouped is-grouped-multiline filter-row">
        <div class="control is-expanded">
          <label class="is-sr-only" for="logging-context">Context</label>
          <div class="select is-fullwidth">
            <select id="logging-context" v-model="context">
              <option value="">All contexts</option>
              <option v-for="option in contexts" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
        </div>
        <div class="control is-expanded">
          <label class="is-sr-only" for="logging-type">Type</label>
          <div class="select is-fullwidth">
            <select id="logging-type" v-model="type">
              <option value="">All types</option>
              <option v-for="option in types" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="is-flex is-justify-content-space-between is-align-items-center">
      <p class="is-size-7 has-text-grey">{{ processed.length }} of {{ logs.length }} entries</p>
      <button type="button" class="button is-small is-ghost" v-if="activeFilters" @click="reset">Clear filters</button>
    </div>
  </div>

  <p class="notification" v-if="logs.length && !processed.length">
    Nothing matches those filters.
  </p>

  <!-- cards, up to the desktop breakpoint -->
  <div class="cards is-hidden-desktop">
    <article class="card log-card" v-for="log in processed" :key="log._id">
      <div class="card-content p-4 has-text-left">
        <div class="is-flex is-justify-content-space-between is-align-items-flex-start mb-2">
          <div class="tags mb-0">
            <span class="tag" :class="typeClass(log)">{{ log.type }}</span>
            <button type="button" class="tag" @click="context = log.context">{{ log.context }}</button>
          </div>
          <p class="is-size-7 has-text-grey is-flex-shrink-0 ml-2">{{ formatDate(log.date) }}</p>
        </div>
        <p class="log-message is-size-7">{{ log.message }}</p>
        <p class="mt-2" v-if="log.ip">
          <button type="button" class="tag" @click="search = log.ip">{{ log.ip }}</button>
        </p>
      </div>
    </article>
  </div>

  <!-- the table stays for screens that have the room for it -->
  <div class="table-container is-hidden-touch" v-if="processed.length">
    <table class="table is-fullwidth is-hoverable">
      <caption class="is-sr-only">Table of logs</caption>
      <thead>
        <tr>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('date')">Date</button></th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('type')">Type</button></th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('context')">Context</button></th>
          <th>Message</th>
          <th><button type="button" class="button is-ghost is-small" @click="sortBy('ip')">Ip</button></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in processed" :key="log._id">
          <td class="is-size-7">{{ formatDate(log.date) }}</td>
          <td><span class="tag" :class="typeClass(log)">{{ log.type }}</span></td>
          <td class="is-size-7">{{ log.context }}</td>
          <td class="is-size-7" :title="log.message">{{ truncate(log.message) }}</td>
          <td class="is-size-7">{{ log.ip }}</td>
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

.log-card .tags {
  gap: 0.375rem;
}

/* log messages carry ids and urls with nothing to wrap on */
.log-message {
  overflow-wrap: anywhere;
}
</style>
