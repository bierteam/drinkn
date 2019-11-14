try {
  if (!process.env.NODE_ENV) console.log('Please set the NODE_ENV')
  if (!process.env.APPSECRET) throw new Error('Please set your APPSECRET to something safe')
  if (!process.env.DEFAULT_USER || !process.env.DEFAULT_PASS) console.log('Not creating a default account...')
  if (!process.env.DB_HOST) throw new Error('Please enter your database url in DB_HOST')
  if (!process.env.DB_USERNAME) throw new Error('Please enter your database username in DB_USERNAME')
  if (!process.env.DB_PASSWORD) throw new Error('Please enter your database password in DB_PASSWORD')
  if (!process.env.DB_NAME) throw new Error('Please enter your database name in DB_NAME')
} catch (error) {
  console.error(error)
  console.error('Committing suicide..')
  process.exit()
}
