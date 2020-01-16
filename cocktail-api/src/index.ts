if (process.env.NODE_ENV !== 'production') require('dotenv').config() // use the .env file for this
import "reflect-metadata"
import { createConnection } from "typeorm"
import * as express from "express"
import * as bodyParser from "body-parser"
import * as helmet from "helmet"
import * as cors from "cors"
import routes from "./routes/routes"

// Connects to the Database -> then starts express
createConnection()
  .then(async connection => {
    // Create a new express application instance
    const app = express()

    // Call middlewares
    app.use(cors())
    app.use(helmet())
    app.use(bodyParser.json())

    app.use("/api/v2/cocktail/", routes)

    const port = process.env.PORT || 3001
    app.listen(port, () => {
      console.log(`Server started on port ${port}!`)
    })
  })
  .catch(error => console.log(error))