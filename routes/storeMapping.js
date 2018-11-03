const storeMapping = (store) => {
  store = store.toLowerCase()
  if (store.includes('agri')) {
    return ('Agrimarkt')
  } else if (store.includes('albert')) {
    return 'Albert Heijn'
  } else if (store.includes('aldi')) {
    return 'Aldi'
  } else if (store.includes('attent')) {
    return 'Attent'
  } else if (store.includes('boni')) {
    return 'Boni'
  } else if (store.includes('boon')) {
    return `Boon's Supermakt`
  } else if (store.includes('coop')) {
    return 'Coop'
  } else if (store.includes('deen')) {
    return 'Deen'
  } else if (store.includes('deka')) {
    return 'DekaMarkt'
  } else if (store.includes('dirk')) {
    return 'Dirk'
  } else if (store.includes('coop')) {
    return 'Coop'
  } else if (store.includes('eko')) {
    return 'EkoPlaza'
  } else if (store.includes('emte')) {
    return 'EMTE'
  } else if (store.includes('hoogv')) {
    return 'HoogVliet'
  } else if (store.includes('linde')) {
    return 'Jan Linders'
  } else if (store.includes('jumbo')) {
    return 'Jumbo'
  } else if (store.includes('lidl')) {
    return 'Lidl'
  } else if (store.includes('mcd')) {
    return 'MCD'
  } else if (store.includes('netto')) {
    return 'Nettorama'
  } else if (store.includes('plus')) {
    return 'Plus'
  } else if (store.includes('poiesz')) {
    return 'Poiez'
  } else if (store.includes('spar')) {
    return 'Spar'
  } else if (store.includes('troef')) {
    return 'TroefMarkt'
  } else if (store.includes('vomar')) {
    return 'Vomar'
  } else if (store.includes('hanos')) {
    return ('Hanos')
  } else if (store.includes('makro')) {
    return ('Makro')
  } else if (store.includes('slig')) {
    return ('Sligro')
  } else if (store.includes('dirck')) {
    return ('Dirck III')
  } else if (store.includes('mitra')) {
    return ('Mitra')
  } else if (store.includes('gall')) {
    return ('Gall & Gall')
  } else if (store.includes('drankd')) {
    return ('DrankDozijn')
  } else if (store.includes('sub')) {
    return ('The SUB')
  } else {
    return (`Store not found for ${store}, using input...`)
  }
}

module.exports = storeMapping
