import { Router } from "express"
import { checkJwt } from "../middlewares/checkJwt"
import { checkRole } from "../middlewares/checkRole"
import IngredientController from "../controllers/ingredientController"

const router = Router()


router.get("/", IngredientController.listAll)
// router.post("/", [checkJwt, checkRole(["ADMIN"])], CocktailController.newCocktail)

export default router