import { Router, Request, Response } from "express";
import auth from "./auth";
import user from "./user";
import cocktail from "./cocktail"
import ingredient from "./ingredient"

const routes = Router();

routes.use("/auth", auth);
routes.use("/user", user);
routes.use("/cocktail", cocktail);
routes.use("/ingredient", ingredient)

export default routes;