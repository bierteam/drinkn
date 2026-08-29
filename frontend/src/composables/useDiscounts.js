import { computed, ref, toRaw } from 'vue'
import Api from '../services/Api'
import { getCachedData, setCachedData } from '../services/db'

const CACHE_KEY = 'discounts'

// The API nests every price under `pricing`, and the views sort and filter on
// those numbers, so they are lifted onto the record itself along with the two
// figures derived from them.
export const decorate = item => ({
  ...item,
  discount: ((item.pricing.oldPrice - item.pricing.newPrice) / 100).toFixed(2),
  discountPercentage: (100 - (item.pricing.newPrice * 100 / item.pricing.oldPrice)).toPrecision(2),
  literPrice: item.pricing.literPrice,
  newPrice: item.pricing.newPrice,
  oldPrice: item.pricing.oldPrice
})

export const average = values => {
  if (!values.length) {
    return 0
  }
  return values.reduce((total, value) => total + Number(value), 0) / values.length
}

const euros = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

export const formatPrice = value => {
  const number = Number(value)
  if (value === null || value === '' || !Number.isFinite(number)) {
    return value
  }
  return euros.format(number)
}

export const useDiscounts = () => {
  const discounts = ref([])
  const loading = ref(true)

  const load = async () => {
    // the cache is an enhancement: failing to read it only costs the instant
    // first paint, and failing to refresh leaves whatever it restored on screen
    try {
      const cached = await getCachedData(CACHE_KEY)
      if (cached?.length) {
        discounts.value = cached
      }
    } catch (error) {
      console.warn('Could not read cached discounts:', error)
    }

    try {
      const response = await Api().get('/api/v1/discounts')
      discounts.value = response.data.map(decorate)
      await setCachedData(CACHE_KEY, structuredClone(toRaw(discounts.value)))
    } catch (error) {
      console.warn('Could not refresh discounts:', error)
    } finally {
      loading.value = false
    }
  }

  // the filter dropdowns list their options alphabetically; the values are
  // Dutch labels, so they are collated rather than compared by code point
  const unique = key => computed(() => [...new Set(discounts.value.map(item => item[key]))]
    .sort((a, b) => String(a).localeCompare(String(b))))
  const averageOf = key => computed(() => average(discounts.value.map(item => item[key])))

  return {
    discounts,
    loading,
    load,
    stores: unique('store'),
    volumes: unique('volume'),
    onlineCount: computed(() => discounts.value.filter(item => item.uri).length),
    averageDiscount: averageOf('discount'),
    averagePercentage: averageOf('discountPercentage'),
    averageLiterPrice: averageOf('literPrice')
  }
}
