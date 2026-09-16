import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailPage } from "../pages/ProductDetailPage";

export const Route = createFileRoute("/product-detail")({
  component: ProductDetailPage,
  head: () => ({ meta: [{ title: "Product Details — Star Home Appliances" }] }),
});
