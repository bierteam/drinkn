import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";
import { Ingredient } from "./Ingredient";

@Entity()
export class Cocktail {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  idDrink: number;
  
  @Column()
  strDrink: string;

  @Column()
  strCategory: string;

  @Column()
  strAlcoholic: string;

  @Column()
  strGlass: string;

  @Column()
  strInstructions: string;

  @Column()
  strDrinkThumb: string;
  
  @Column()
  strIngredient1: string;
  
  @Column()
  strIngredient2: string;
  
  @Column()
  strIngredient3: string;
  
  @Column()
  strIngredient4: string;
  
  @Column()
  strIngredient5: string;
  
  @Column()
  strIngredient6: string;
  
  @Column()
  strIngredient7: string;
  
  @Column()
  strIngredient8: string;
  
  @Column()
  strIngredient9: string;
  
  @Column()
  strIngredient10: string;
  
  @Column()
  strIngredient11: string;
  
  @Column()
  strIngredient12: string;
  
  @Column()
  strIngredient13: string;
  
  @Column()
  strIngredient14: string;
  
  @Column()
  strIngredient15: string;

  @Column()
  strMeasure1: string;

  @Column()
  strMeasure2: string;

  @Column()
  strMeasure3: string;

  @Column()
  strMeasure4: string;

  @Column()
  strMeasure5: string;

  @Column()
  strMeasure6: string;

  @Column()
  strMeasure7: string;


  @Column()
  strMeasure8: string;

  @Column()
  strMeasure9: string;

  @Column()
  strMeasure10: string;

  @Column()
  strMeasure11: string;

  @Column()
  strMeasure12: string;

  @Column()
  strMeasure13: string;

  @Column()
  strMeasure14: string;

  @Column()
  strMeasure15: string;

  @Column()
  ingredients: string;

  @Column()
  dateModified: Date;
}