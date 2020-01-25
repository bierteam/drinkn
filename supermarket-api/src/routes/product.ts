
  import { Router } from "express"
  import productController from "../controllers/productController"
  import { checkJwt } from "../middlewares/checkJwt"
  import { checkRole } from "../middlewares/checkRole"

  const router = Router()

  //Get all users
  router.get("/", productController.saveProducts)


  export default router