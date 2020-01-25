import express from 'express'
import mongoose from 'mongoose'

import compression from 'compression'
import cors from 'cors'

import { MONGODB_URI } from './util/secrets'

import { CocktailRoutes } from './routes/cocktailRoutes'
import { IngredientRoutes } from './routes/ingredientRoutes'
require('dotenv').config()

// Fix mongoose deprecations
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
mongoose.set('useUnifiedTopology', true)
mongoose.set('useNewUrlParser', true)

class Server {
  public app: express.Application;

  constructor () {
    this.app = express()
    this.config()
    this.routes()
    this.mongo()
  }

  public routes (): void {
    this.app.use('/api/v2/mix/cocktail', new CocktailRoutes().router)
    this.app.use('/api/v2/mix/ingredient', new IngredientRoutes().router)
  }

  public config (): void {
    this.app.set('port', process.env.PORT || 3001)
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(compression())
    this.app.use(cors())
  }

  private mongo () {
    const connection = mongoose.connection
    connection.on('connected', () => {
      console.log('Mongo Connection Established')
    })
    connection.on('reconnected', () => {
      console.log('Mongo Connection Reestablished')
    })
    connection.on('disconnected', () => {
      console.log('Mongo Connection Disconnected')
      console.log('Trying to reconnect to Mongo ...')
      setTimeout(() => {
        mongoose.connect(MONGODB_URI, {
          keepAlive: true,
          socketTimeoutMS: 3000,
          connectTimeoutMS: 3000
        })
      }, 3000)
    })
    connection.on('close', () => {
      console.log('Mongo Connection Closed')
    })
    connection.on('error', (error: Error) => {
      console.log('Mongo Connection ERROR: ' + error)
    })

    const run = async () => {
      await mongoose.connect(MONGODB_URI, {
        keepAlive: true
      })
    }
    run().catch(error => console.error(error))
  }

  public start (): void {
    this.app.listen(this.app.get('port'), () => {
      console.log(
        'API is running at', this.app.get('port')
      )
    })
  }
}

const server = new Server()

server.start()
