const uriPrettifier = rawUri => {
  const uri = rawUri
    .replace(/(.*)tion:/g, '')
    .replace(/%2F/g, '/')
    .replace(/%3A/g, ':')
    .replace(/(.*)diurl=/g, '')
    .replace(/(.*)diurl%3D/g, '')
    .replace(/\?utm_source(.*)/g, '')
    .replace(/%3Freturn(.*)/g, '')
    .replace(/\?return(.*)/g, '')
    .replace(/(.*)&p=/g, '')
    .replace(/http[^s]/g, 'https:')
    .replace(/%253A/g, ':')
    .replace(/%252F/g, '/')
    .replace(/%23tab2(.*)/g, '')
    .replace(/(.*)u=/g, 'https://jumbo.com')
    .replace(/\[/g, '')
    .replace(/\]/g, '')
    .replace(/%3F(.*)/g, '')
    .replace(/%5D(.*)/g, '')
    .replace(/(.*)%5B/g, '')

  return uri
}

module.exports = uriPrettifier
