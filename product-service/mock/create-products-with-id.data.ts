export const createProductsWithId = [
  {
    product_id: "a65d28fe-a86c-4ae8-b75d-e92f5840dae3",
    title: "CSV Product A",
    description: "Description of Product A",
    count: 1,
    price: 11.1,
  },
  {
    product_id: "71746ceb-0951-475b-b0ab-a10b9cc4cfd3",
    title: "CSV Product B",
    description: "Description of Product B",
    count: 2,
    price: 12.2,
  },
  {
    product_id: "6cc950f8-18fb-4d0b-8890-313634d1a9a1",
    title: "CSV Product C",
    description: "Description of Product C",
    count: 3,
    price: 13.3,
  },
  {
    product_id: "64c76aae-18dc-4b82-9724-c0baa55289fe",
    title: "CSV Product D",
    description: "Description of Product D",
    count: 4,
    price: 14.4,
  },
  {
    product_id: "a93e1db9-c5a6-466a-8396-de1fe61c2d77",
    title: "CSV Product E",
    description: "Description of Product E",
    count: 5,
    price: 15.5,
  },
];

export const totalPrice = createProductsWithId.reduce(
  (s, p) => s + Number(p.price),
  0
);

export const totalCount = createProductsWithId.reduce(
  (s, p) => s + Number(p.count),
  0
);
