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
      // 1) static -> venue coords
      const staticRes = await fetchVenueStaticData(venueSlug);
      const [venueLng, venueLat] = staticRes.venue_raw.location.coordinates;

      // 2) dynamic -> order_min_no_surcharge, basePrice, distanceRanges
      const dynamicRes = await fetchVenueDynamicData(venueSlug);
      const orderMin = dynamicRes.venue_raw.delivery_specs.order_minimum_no_surcharge;
      const basePrice = dynamicRes.venue_raw.delivery_specs.delivery_pricing.base_price;
      const distanceRanges =
        dynamicRes.venue_raw.delivery_specs.delivery_pricing.distance_ranges;

      // 3) convert cart -> cents
      const cartVal = typeof cartValue === "number" ? cartValue : 0;
      const cartInCents = Math.round(cartVal * 100);

      // 4) distance
      const dist = Math.round(
        calculateDistance(
          Number(latitude),
          Number(longitude),
          venueLat,
          venueLng
        )
      );
      setDeliveryDistance(dist);

      // 5) surcharge
      const surchargeRes = calcSmallOrderSurcharge(cartInCents, orderMin);
      setSurcharge(surchargeRes);

      // 6) delivery fee
      const fee = calcDeliveryFee(basePrice, dist, distanceRanges);
      if (fee < 0) {
        setApiError("Delivery is not possible for this distance.");
        return;
      }
      setDeliveryFee(fee);

      // 7) total
      const total = calcTotal(cartInCents, fee, surchargeRes);
      setTotalPrice(total);
    } catch (err: unknown) {
      console.error(err);
      setApiError("Failed to fetch data or calculate price.");
    }
  };

  return (
    <div>
      <h2>Delivery Order Price Calculator</h2>

      
      <div className="details-box">
        <h3>Details</h3>
        <form onSubmit={handleCalculate}>
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

          <button type="submit">Calculate delivery price</button>
        </form>
      </div>

      {/* Show any error from API or geolocation */}
      {apiError && <ErrorMessage message={apiError} />}

     {/* Show the calculated price breakdown */}
      {(totalPrice > 0 || surcharge > 0 || deliveryFee > 0) && (
        <div className="breakdown-box" style={{ marginTop: "1rem" }}>
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
