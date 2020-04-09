
import { Request, Response } from 'express'
import { Cocktail, ICocktail } from '../models/cocktail'

export class CocktailController {

  public async getCocktails(req: Request, res: Response): Promise<void> {
    const pageSize = parseInt(req.query.pagesize);
    const cocktails = await Cocktail.find({},{strDrink: 1, ingredients: 1, strInstructions: 1}).limit(pageSize);
    res.json(cocktails);
  }

  public async getCocktail (req: Request, res: Response): Promise<void> {
    const cocktailName = "/.*" + req.params.id + ".*/";
    const cocktail = await Cocktail.find({ displayName: new RegExp(cocktailName, "i") });
    res.json(cocktail);
  }

  public async getCocktailsIncludingIngredients (req: Request, res: Response): Promise<void> {
    const userIngredients = req.body
    console.log('User input: ' + userIngredients)
    const cocktailsIncludingIngredients = await Cocktail.find({ ingredients: { $in: userIngredients } });
    res.json(cocktailsIncludingIngredients)
  }
}
