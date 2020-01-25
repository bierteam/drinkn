import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm"
import { Length, IsNotEmpty } from "class-validator"

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  prod_id: string

  @Column()
  @Length(4, 20)
  username: String

  @Column()
  @IsNotEmpty()
  quantity: Number

  @Column()
  discount_label: String

  @Column()
  unit: String

  @Column()
  price: Number

  @Column()
  img: String

  @Column()
  name: String

}