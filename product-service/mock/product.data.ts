import { Product } from "../types/product.type";
import { Stock } from "../types/stock.type";

export const products = [
  {
    id: "4e7a7d57-6309-46e4-81fc-e0498cfa7872",
    title: "Product 1",
    description: "Description of Product 1",
    price: 100,
  },
  {
    id: "ac33bade-b710-4ca3-a1c9-6474f2daf194",
    title: "Product 2",
    description: "Description of Product 2",
    price: 200,
  },
  {
    id: "380c28a6-f905-4dc8-9a7e-fd47118c95e3",
    title: "Product 3",
    description: "Description of Product 3",
    price: 300,
  },
] as Product[];

export const stocks = [
  {
    product_id: "4e7a7d57-6309-46e4-81fc-e0498cfa7872",
    count: 1,
  },
  {
    product_id: "ac33bade-b710-4ca3-a1c9-6474f2daf194",
    count: 2,
  },
  {
    product_id: "380c28a6-f905-4dc8-9a7e-fd47118c95e3",
    count: 3,
  },
] as Stock[];
