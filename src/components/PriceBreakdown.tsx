import { FC } from "react";
import { PriceBreakdownProps } from "../types/type";

const PriceBreakdown: FC<PriceBreakdownProps> = ({
  cartValue,
  surcharge,
  deliveryFee,
  totalPrice,
  deliveryDistance,
}) => {

  const formatEUR = (cents: number) => `${(cents / 100).toFixed(2)} EUR`;

  return (
    <div style={{ marginTop: "1rem" }}>
      <h2>Price Breakdown</h2>
      <p>
        Cart Value:{" "}
        <span data-raw-value={cartValue}>
          {formatEUR(cartValue)}
        </span>
      </p>
      <p>
        Small Order Surcharge:{" "}
        <span data-raw-value={surcharge}>
          {formatEUR(surcharge)}
        </span>
      </p>
      <p>
        Delivery Fee:{" "}
        <span data-raw-value={deliveryFee}>
          {formatEUR(deliveryFee)}
        </span>
      </p>
      <p>
        Delivery Distance:{" "}
        <span data-raw-value={deliveryDistance}>
          {deliveryDistance} m
        </span>
      </p>
      <p>
        Total Price:{" "}
        <span data-raw-value={totalPrice}>
          {formatEUR(totalPrice)}
        </span>
      </p>
    </div>
  );
};

export default PriceBreakdown;
