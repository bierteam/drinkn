import { Router } from "express";
import { IngredientController } from "../controllers/ingredientController";


export class IngredientRoutes {

  public router: Router;
  public ingredientController: IngredientController = new IngredientController();


  constructor() {
    this.router = Router();
    this.routes();
  }

  routes() {
    this.router.get("/", this.ingredientController.getIngredients);
  }
}