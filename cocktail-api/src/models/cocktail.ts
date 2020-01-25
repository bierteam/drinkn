import { Document, Schema, Model, model, Error } from "mongoose";

export interface ICocktail extends Document {
  idDrink: String;
  strDrink: String;
  strInstructions: String;
  ingrdients: Array<String>;
}

export const cocktailSchema = new Schema({
  idDrink: {
    type: String, required: true,
    unique: true
  },
  strDrink: {
    type: String, required: true,
    unique: true
  },
  strInstructions: {
    type: String, required: true,
    unique: true
  },
  ingredients: {
    type: Array, required: true,
  },
});



export const Cocktail: Model<ICocktail> = model<ICocktail>("Cocktail", cocktailSchema);