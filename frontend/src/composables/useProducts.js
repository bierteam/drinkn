import { ref } from 'vue'
import Api from '../services/Api'

// Every amount from /api/v1/products is an integer number of cents, litre price
// included. The old /discounts payload mixed the two -- prices in cents, litre
// price in euros -- and Discounts.vue divided some fields by 100 and not others
// to compensate.
export const formatCents = value => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(value) / 100)
}

export const discountPercentage = item => {
  const { current, base } = item.price ?? {}
  // a product at its normal price has no base to compare against. The old
  // decorate() divided by oldPrice unconditionally, which on a non-discounted
  // record gives Infinity and sorts to the top.
  if (!base || !current || base <= current) return null
  return Math.round(100 - (current * 100 / base))
}

export const useProducts = () => {
  const products = ref([])
  const facets = ref({ stores: [], total: 0, discounted: 0 })
  const loading = ref(true)
  const total = ref(0)
  const totalPages = ref(0)
  const error = ref(null)

  // Paged on the server. Fetching everything and filtering in the browser is
  // what /discounts does; it holds up at a few hundred offers and does not at
  // the ~900 products of a single retailer's beer assortment.
  const load = async (query = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await Api().get('/api/v1/products', { params: query })
      products.value = response.data.items
      total.value = response.data.total
      totalPages.value = response.data.totalPages
    } catch (err) {
      console.warn('Could not load products:', err)
      error.value = 'Could not load products.'
    } finally {
      loading.value = false
    }
  }

  const loadFacets = async () => {
    try {
      const response = await Api().get('/api/v1/products/facets')
      facets.value = response.data
    } catch (err) {
      // the dropdown degrades to "all stores"; not worth failing the page over
      console.warn('Could not load facets:', err)
    }
  }

  return { products, facets, loading, total, totalPages, error, load, loadFacets }
}
