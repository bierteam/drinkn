import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  //Get the jwt token from the head
  const token = <string>req.headers.authorization;
  let jwtPayload;

  //Try to validate the token and get data
  try {
    if (token == null) {
      console.log("No JWT Provided in request");
      res.status(401).send();
      return;
    } else {
      jwtPayload = <any>jwt.verify(token, process.env.JWTSECRET);
      console.log(jwtPayload.sub)
    }
  } catch (error) {
    console.log(error)
    //If token is not valid, respond with 401 (unauthorized)
    res.status(401).send();
    return;
  }

  //Call the next middleware or controller
  next();
};