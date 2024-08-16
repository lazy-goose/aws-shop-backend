import { Product, Stock } from "../assets/lambda/common/schemas";

export const products = [
  {
    id: "daddf875-571a-48e5-8c0a-09d61941ee2c",
    title: "Lipstick",
    description: "Description of lipstick",
    price: 9.99,
    imageUrl:
      "https://images.unsplash.com/photo-1619506147143-803515ade202?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NDI3MjN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MjM0MTI4NjR8&ixlib=rb-4.0.3&q=80&w=400",
  },
  {
    id: "24c5449d-6ea7-493d-b1f1-c13343b1741d",
    title: "Knitting threads",
    description: "Description of knitting threads",
    price: 4.99,
    imageUrl:
      "https://images.unsplash.com/photo-1660733099396-f33fd8c2cdcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2NDI3MjN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MjM0MTI4NzF8&ixlib=rb-4.0.3&q=80&w=400",
  },
  {
    id: "e61d4c5d-3200-4dd0-b375-7918d73fa51b",
    title: "Hair brush",
    description: "Description of hair brush",
    price: 3.25,
    imageUrl:
      "https://images.unsplash.com/photo-1680670500665-22e480bcb0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400",
  },
  {
    id: "cc55a77f-60c1-4aa4-b920-2aff76c5d804",
    title: "Cutlery",
    description: "Description of cutlery",
    price: 15.99,
    imageUrl:
      "https://images.unsplash.com/photo-1607637508078-17fa89da51b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.0.3&q=80&w=400",
  },
  {
    id: "6946abd1-c1c7-44d6-b76c-161a8693c7fd",
    title: "Broom",
    description: "Description of broom",
    price: 15.97,
    imageUrl:
      "https://images.unsplash.com/photo-1551731494-e17c67304912?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDJ8fGJyb29tfGVufDB8fDB8fHww&ixlib=rb-4.0.3&q=80&w=400",
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
