
import { Request, Response } from 'express'
import { Ingredient } from '../models/ingredient'

export class IngredientController {
  public async getIngredients (req: Request, res: Response): Promise<void> {
    const ingredients = await Ingredient.find()
    res.json(ingredients)
  }
}
