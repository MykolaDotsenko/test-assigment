import { useState } from "react";

const Calculator: React.FC = () => {
  const [venueSlug, setVenueSlug] = useState("home-assignment-venue-helsinki");
  const [cartValue, setCartValue] = useState("0");
  const [userLatitude, setUserLatitude] = useState("0000");
  const [userLongitude, setUserLongitude] = useState("00000");
  const [priceBreakdown, setPriceBreakdown] = useState({
    cartValue: "0,00 €",
    deliveryFee: "0,00 €",
    deliveryDistance: "0 m",
    smallOrderSurcharge: "0,00 €",
    totalPrice: "0,00 €",
  });

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-6">
        Delivery Order Price Calculator
      </h1>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1">Venue slug</label>
            <input
              type="text"
              data-test-id="venueSlug"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Cart value (EUR)</label>
            <input
              type="number"
              data-test-id="cartValue"
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">User latitude</label>
            <input
              type="number"
              data-test-id="userLatitude"
              className="w-full p-2 border border-gray-300 rounded"
              step="any"
            />
          </div>

          <div>
            <label className="block mb-1">User longitude</label>
            <input
              type="number"
              data-test-id="userLongitude"
              className="w-full p-2 border border-gray-300 rounded"
              step="any"
            />
          </div>

          <button
            data-test-id="getLocation"
            className="w-full p-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Get location
          </button>

          <button className="w-full p-2 border border-gray-300 rounded hover:bg-gray-50">
            Calculate delivery price
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Price breakdown</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Cart Value</span>
            <span data-raw-value="1000">{priceBreakdown.cartValue}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery fee</span>
            <span data-raw-value="190">{priceBreakdown.deliveryFee}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery distance</span>
            <span data-raw-value="177">{priceBreakdown.deliveryDistance}</span>
          </div>
          <div className="flex justify-between">
            <span>Small order surcharge</span>
            <span data-raw-value="0">{priceBreakdown.smallOrderSurcharge}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total price</span>
            <span data-raw-value="1190">{priceBreakdown.totalPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
