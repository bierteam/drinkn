if (process.env.NODE_ENV !== 'production') require('dotenv').config()
try {
  if (!process.env.NODE_ENV) console.log('Please set the NODE_ENV')
  if (!process.env.MONGODB_URI) throw new Error('Please enter your database url in MONGO_URI')
  if (!process.env.JWTSECRET) throw new Error('Please enter a secure JWTSECRET')
} catch (error) {
  console.error(error)
  const messages = [
    'Committing suicide, goodbye.',
    'Seppuku!',
    'Goodbye!',
    'Please love me more.',
    'The future is just old age and illness and pain.... I must have peace and this is the only way.',
    'And so I leave this world, where the heart must either break or turn to lead.',
    'Goodbye, everybody',
    '💥',
    "it's not that hard",
    "I'm ending it here."
  ]
  console.error(`%c ________________________________________
  < ${messages[Math.floor(Math.random() * messages.length)]} >
   ----------------------------------------
       \\   ^__^
        \\  (oo)\\_______
          (__)\\       )\\/\\
              ||----w |
              ||     ||`, 'font-family:monospace')

  // console.error(`
  //    __-----_________________{]__________________________________________________
  //   {&&&&&&&#%%&#%&%&%&%&%#%&|]__________________________________________________/
  //                            {]`)
  process.exit()
}
