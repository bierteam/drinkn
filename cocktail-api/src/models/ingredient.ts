import { Document, Schema, Model, model, Error } from "mongoose";

export interface IIngredient extends Document {
  ingredient: string;
}

export const ingredientSchema = new Schema({
  ingredient: {
    type: String, required: true,
    unique: true
  }
});



export const Ingredient: Model<IIngredient> = model<IIngredient>("Ingredient", ingredientSchema);