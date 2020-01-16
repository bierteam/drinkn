import { Request, Response } from "express"
import { getRepository } from "typeorm"

import { Ingredient } from "../entity/Ingredient"
let ingredients
class IngredientController{

static listAll = async (req: Request, res: Response) => {
  const cocktailRepository = getRepository(Ingredient)
  if (!ingredients) {
    ingredients = await cocktailRepository.find()
  }
  res.send(ingredients)
}
//TODO: Create ingredient here


}

export default IngredientController