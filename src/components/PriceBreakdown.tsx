import { FC } from "react";
import { PriceBreakdownProps } from "../types/type";

const PriceBreakdown: FC<PriceBreakdownProps> = ({
  cartValue,
  surcharge,
  deliveryFee,
  totalPrice,
}) => {
  return (
    <div>
      <p>Sum {cartValue} EUR</p>
      <p>surcharge {surcharge}</p>
      <p>delivery {deliveryFee}</p>
      <p>total {totalPrice}</p>
    </div>
  );
};

export default PriceBreakdown;
