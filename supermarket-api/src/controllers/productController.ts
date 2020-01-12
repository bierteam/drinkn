import { getRepository } from "typeorm";
import { Product } from '../entity/Product';
import { HiiperService } from "../services/HiiperService"
import { getMongoRepository } from "typeorm";

class ProductController {

  static saveProducts = async () => {
    const productRepository = getMongoRepository(Product);
    const hiiperService = new HiiperService();
    hiiperService.RequestProductsAsync().then(function (value) {
      productRepository.insertMany(value);
    });
  };
};

export default ProductController;