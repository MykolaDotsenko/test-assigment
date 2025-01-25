import React, { useState } from "react";
import InputFields from "./InputFields";
import PriceBreakdown from "./PriceBreakdown";
import ErrorMessage from "./ErrorMessage";
import { fetchVenueStaticData, fetchVenueDynamicData } from "../services/api";
import {
  calcSmallOrderSurcharge,
  calcDeliveryFee,
  calcTotal,
} from "../utils/calculations";
import { calculateDistance } from "../utils/distance";

const Calculator: React.FC = () => {
  const [venueSlug, setVenueSlug] = useState<string>("");
  const [cartValue, setCartValue] = useState<number | "">("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState("");

  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [surcharge, setSurcharge] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);


  const handleLocation = () => {
    if (!navigator.geolocation) {
      setApiError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => {
        setApiError("Failed to get your location.");
      }
    );
  };

 
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!venueSlug.trim()) newErrors.venueSlug = "Venue slug is required.";
    if (cartValue === "") newErrors.cartValue = "Cart value is required.";
    if (latitude === "") newErrors.latitude = "Latitude is required.";
    if (longitude === "") newErrors.longitude = "Longitude is required.";

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError("");
    setDeliveryDistance(0);
    setSurcharge(0);
    setDeliveryFee(0);
    setTotalPrice(0);

    if (!validateForm()) return;

    try {
      // 1) Fetch static => venue coords
      const staticRes = await fetchVenueStaticData(venueSlug);
      const [venueLng, venueLat] = staticRes.venue_raw.location.coordinates;

      // 2) Fetch dynamic => surcharge + basePrice + distanceRanges
      const dynamicRes = await fetchVenueDynamicData(venueSlug);
      const orderMin =
        dynamicRes.venue_raw.delivery_specs.order_minimum_no_surcharge;
      const basePrice =
        dynamicRes.venue_raw.delivery_specs.delivery_pricing.base_price;
      const distanceRanges =
        dynamicRes.venue_raw.delivery_specs.delivery_pricing.distance_ranges;

      // 3) Convert cart value => cents
      const cartVal = typeof cartValue === "number" ? cartValue : 0;
      const cartInCents = Math.round(cartVal * 100);

      const dist = Math.round(
        calculateDistance(
          Number(latitude),
          Number(longitude),
          venueLat,
          venueLng
        )
      );
      setDeliveryDistance(dist);

      const surchargeRes = calcSmallOrderSurcharge(cartInCents, orderMin);
      setSurcharge(surchargeRes);

      const fee = calcDeliveryFee(basePrice, dist, distanceRanges);
      if (fee < 0) {
        setApiError("Delivery is not possible for this distance.");
        return;
      }
      setDeliveryFee(fee);

      const total = calcTotal(cartInCents, fee, surchargeRes);
      setTotalPrice(total);
    } catch (err: unknown) {
      console.error(err);
      setApiError("Failed to fetch data or calculate price.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Delivery Order Price Calculator
      </h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
        <form onSubmit={handleCalculate} className="space-y-6">
          <InputFields
            venueSlug={venueSlug}
            setVenueSlug={setVenueSlug}
            cartValue={cartValue}
            setCartValue={setCartValue}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            handleLocation={handleLocation}
            errors={fieldErrors}
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Calculate delivery price
          </button>
        </form>
      </div>

      {apiError && (
        <div className="mt-6 bg-red-100 text-red-700 p-4 rounded-lg shadow">
          <ErrorMessage message={apiError} />
        </div>
      )}

      {(totalPrice > 0 || surcharge > 0 || deliveryFee > 0) && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <PriceBreakdown
            cartValue={totalPrice - surcharge - deliveryFee}
            surcharge={surcharge}
            deliveryFee={deliveryFee}
            deliveryDistance={deliveryDistance}
            totalPrice={totalPrice}
          />
        </div>
      )}
    </div>
  );
};

export default Calculator;
