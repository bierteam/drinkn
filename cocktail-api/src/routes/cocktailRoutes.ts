import { Router } from 'express'
import { CocktailController } from '../controllers/cocktailController'
import { checkJwt } from '../middlewares/checkJwt';

export class CocktailRoutes {
  public router: Router;
  public cocktailController: CocktailController = new CocktailController();

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.get('/', checkJwt, this.cocktailController.getCocktails)
    this.router.get('/:id', this.cocktailController.getCocktail)
    this.router.post('/personal', this.cocktailController.getCocktailsIncludingIngredients)
  }
}
