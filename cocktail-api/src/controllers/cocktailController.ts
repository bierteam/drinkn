
import { Request, Response } from 'express'
import { Cocktail, ICocktail } from '../models/cocktail'

export class CocktailController {
<<<<<<< HEAD
  public async getCocktails (req: Request, res: Response): Promise<void> {
    const cocktails = await Cocktail.find()
    console.log(cocktails)
    res.json(cocktails)
=======

  public async getCocktails(req: Request, res: Response): Promise<void> {
    const cocktails = await Cocktail.find();
    res.json(cocktails);
>>>>>>> dc16421936b66114f167288b5cd3ea2c35f25e0f
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
