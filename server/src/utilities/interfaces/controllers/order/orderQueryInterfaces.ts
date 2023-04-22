// CURRENCY INTERFACE
import CurrencyInterface from "../../payment/CurrencyInterface";
// SINGLE ORDER SCHEMA INTERFACE
import { SingleOrderSchemaInterface } from "../../models";
// PRICE INTERFACE FOR QUERY GTE & LTE
import { priceQueryInterface } from "../";
// MONGOOSE
import { ObjectId } from "mongoose";

interface SingleOrderQuery {
  amount: number;
  price: { $gte: number | undefined; $lte: number | undefined };
  tax: number;
  product: ObjectId | string;
  orderPage: number;
}
// TO GET REQ FROM CLIENT SIDE
interface OrderClientReqInterface
  extends CurrencyInterface,
    priceQueryInterface {
  isShipping: boolean;
  status: "pending" | "failed" | "paid" | "delivered" | "canceled";
  user: ObjectId | string;
  orderPage: number;
  priceVal: string;
}

export { OrderClientReqInterface, SingleOrderQuery };