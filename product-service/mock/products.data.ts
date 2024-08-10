import { Product, Stock } from "../assets/lambda/common/schemas";

export const products = [
  {
    id: "daddf875-571a-48e5-8c0a-09d61941ee2c",
    title: "Product 1",
    description: "Description of Product 1",
    price: 100,
  },
  {
    id: "24c5449d-6ea7-493d-b1f1-c13343b1741d",
    title: "Product 2",
    description: "Description of Product 2",
    price: 200,
  },
  {
    id: "e61d4c5d-3200-4dd0-b375-7918d73fa51b",
    title: "Product 3",
    description: "Description of Product 3",
    price: 300,
  },
  {
    id: "cc55a77f-60c1-4aa4-b920-2aff76c5d804",
    title: "Product 4",
    description: "Description of Product 4",
    price: 400,
  },
  {
    id: "6946abd1-c1c7-44d6-b76c-161a8693c7fd",
    title: "Product 5",
    description: "Description of Product 5",
    price: 500,
  },
] as Product[];

export const stocks = [
  {
    product_id: "daddf875-571a-48e5-8c0a-09d61941ee2c",
    count: 1,
  },
  {
    product_id: "24c5449d-6ea7-493d-b1f1-c13343b1741d",
    count: 2,
  },
  {
    product_id: "e61d4c5d-3200-4dd0-b375-7918d73fa51b",
    count: 3,
  },
  {
    product_id: "cc55a77f-60c1-4aa4-b920-2aff76c5d804",
    count: 4,
  },
  {
    product_id: "6946abd1-c1c7-44d6-b76c-161a8693c7fd",
    count: 5,
  },
] as Stock[];
