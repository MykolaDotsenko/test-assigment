import { FC } from "react";
import { PriceBreakdownProps } from "../types/type";

const PriceBreakdown: FC<PriceBreakdownProps> = ({
  cartValue,
  surcharge,
  deliveryFee,
  deliveryDistance,
  totalPrice,
}) => {
  return (
    <div>
      <p data-raw-value={cartValue}>Cart Value: {cartValue / 100}</p>
      <p data-raw-value={surcharge}>Small Order: {cartValue / 100}</p>
      <p data-raw-value={deliveryFee}>Delivery fee: {cartValue / 100}</p>
      <p data-raw-value={deliveryDistance}>
        delivery distance: {cartValue / 100}
      </p>
      <p data-raw-value={totalPrice}>total price: {cartValue / 100}</p>
    </div>
  );
};

export default PriceBreakdown;
