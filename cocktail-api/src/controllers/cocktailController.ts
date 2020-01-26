
import { Request, Response } from 'express'
import { Cocktail, ICocktail } from '../models/cocktail'

export class CocktailController {

  public async getCocktails(req: Request, res: Response): Promise<void> {
    const cocktails = await Cocktail.find({},{strDrink: 1, ingredients: 1, strInstructions: 1});
    res.json(cocktails);
  }

  public async getCocktail (req: Request, res: Response): Promise<void> {
    const cocktail = await Cocktail.findOne({ strDrink: req.params.id })
    if (cocktail === null) {
      res.sendStatus(404)
    } else {
      res.json(cocktail)
    }
  }

  public async getCocktailsIncludingIngredients (req: Request, res: Response): Promise<void> {
    const userIngredients = req.body
    console.log('User input: ' + userIngredients)
    const cocktailsIncludingIngredients = await Cocktail.find({ ingredients: { $in: userIngredients } })
    res.json(cocktailsIncludingIngredients)
  }
}
