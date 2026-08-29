// The `(.*)` patterns this used to carry were unanchored and global, so the
// engine retried them at every position -- quadratic on long uris. Anchoring
// them says the same thing in one pass: strip everything up to the last
// marker, or from the first marker to the end.
const uriPrettifier = rawUri => {
  const uri = rawUri
    .replace(/^.*tion:/, '')
    .replaceAll('%2F', '/')
    .replaceAll('%3A', ':')
    .replace(/^.*diurl=/, '')
    .replace(/^.*diurl%3D/, '')
    .replace(/\?utm_source.*$/, '')
    .replace(/%3Freturn.*$/, '')
    .replace(/\?return.*$/, '')
    .replace(/^.*&p=/, '')
    .replace(/http[^s]/g, 'https:')
    .replaceAll('%253A', ':')
    .replaceAll('%252F', '/')
    .replace(/%23tab2.*$/, '')
    .replace(/^.*u=/, 'https://jumbo.com')
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replace(/%3F.*$/, '')
    .replace(/%5D.*$/, '')
    .replace(/^.*%5B/, '')

  return uri
}

module.exports = uriPrettifier
