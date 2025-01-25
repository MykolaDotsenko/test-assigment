import  { FC } from "react";
import { PriceBreakdownProps } from "../types/type";

const PriceBreakdown: FC<PriceBreakdownProps> = ({
  cartValue,
  surcharge,
  deliveryFee,
  totalPrice,
  deliveryDistance,
}) => {
  const formatEUR = (cents: number) => `${(cents / 100).toFixed(2)} €`;

  return (
    <div className="mt-4">
      <h2 className="text-lg font-bold mb-4">Price Breakdown</h2>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Cart Value</span>
          <span data-raw-value={cartValue} className="font-semibold">
            {formatEUR(cartValue)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Small Order Surcharge</span>
          <span data-raw-value={surcharge} className="font-semibold">
            {formatEUR(surcharge)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span>
          <span data-raw-value={deliveryFee} className="font-semibold">
            {formatEUR(deliveryFee)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery Distance</span>
          <span data-raw-value={deliveryDistance} className="font-semibold">
            {deliveryDistance} m
          </span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-2">
          <span>Total Price</span>
          <span data-raw-value={totalPrice}>{formatEUR(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
};

export default PriceBreakdown;
