import {
  Entity,
  PrimaryGeneratedColumn,
  Column
} from "typeorm"

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number
  
  @Column()
  ingredient: string
}