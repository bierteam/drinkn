import { Router } from 'express'
import { CocktailController } from '../controllers/cocktailController'

export class CocktailRoutes {
  public router: Router;
  public cocktailController: CocktailController = new CocktailController();

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get('/', this.cocktailController.getCocktails)
    this.router.get('/:id', this.cocktailController.getCocktail)
    this.router.post('/personal', this.cocktailController.getCocktailsIncludingIngredients)
  }
}
