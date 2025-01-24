import { useState } from "react";
import {
  calcDeliveryFee,
  calcSmallOrderSurcharge,
  calcTotal,
} from "../utils/calculations";
import { fetchVenueStaticData, fetchVenueDynamicData } from "../services/api";
import InputFields from "./InputFields";
import PriceBreakdown from "./PriceBreakdown";
import { calculateDistance } from "../utils/disstance";

const Calculator: React.FC = () => {
  const [venueSlug, setVenueSlug] = useState<string>("");
  const [cartValue, setCartValue] = useState<number | "">("");
  const [coordinates, setCoordinates] = useState<{
    lat: number | "";
    lng: number | "";
  }>({
    lat: "",
    lng: "",
  });
  const [venueCoordinates, setVenueCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [deliveryDistance, setDeliveryDistance] = useState<number>(0);
  const [orederMinimum, setOrderMinimum] = useState<number>(0);

  const [surcharge, setSurcharge] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const handleLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  const isFormValid = (): boolean => {
    return (
      venueSlug !== "" &&
      cartValue !== "" &&
      coordinates.lat !== "" &&
      coordinates.lng !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("Please enter a venue slug.");
      return;
    }

    try {
      const staticData = await fetchVenueStaticData(venueSlug);
      const dynamicData = await fetchVenueDynamicData(venueSlug);
      //   const restaurantCoordinates = {
      //     lat: staticData.location.lat,
      //     lng: staticData[0],
      //   };

      const restaurantLan =
        staticData.venue.delivery_geo_range.coordinates[0][0][1];
      const restaurantLng =
        staticData.venue.delivery_geo_range.coordinates[0][0][0];

      setVenueCoordinates({ lat: restaurantLan, lng: restaurantLng });
      const orederMinimum = staticData.venue.order_minimum;
      setOrderMinimum(orederMinimum);
      const distance = calculateDistance(
        coordinates.lat as number,
        coordinates.lng as number,
        staticData.location.lat,
        staticData.location.lng
      );
      setDeliveryDistance(distance);

      const surcharge = calcSmallOrderSurcharge(
        cartValue as number,
        orederMinimum
      );

      const deliveryFee = calcDeliveryFee(
        dynamicData.venue_raw.delivery_specs.original_delivery_price,
        distance,
        dynamicData.venue_raw.delivery_specs.delivery_pricing.distance_ranges
      );

      const totalPrice = calcTotal(cartValue as number, deliveryFee, surcharge);

      setSurcharge(surcharge);
      setDeliveryFee(deliveryFee);
      setTotalPrice(totalPrice);
    } catch (error) {
      console.error("Error fetching venue data:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-6">
        Delivery Order Price Calculator
      </h1>

      <form onSubmit={handleSubmit} action="">
        <InputFields
          venueSlug={venueSlug}
          setVenueSlug={setVenueSlug}
          cartValue={cartValue}
          setCartValue={setCartValue}
          latitude={coordinates.lat}
          setLatitude={(lat) => setCoordinates((prev) => ({ ...prev, lat }))}
          longitude={coordinates.lng}
          setLongitude={(lng) => setCoordinates((prev) => ({ ...prev, lng }))}
          handleLocation={handleLocation}
        />
      </form>

      <div>
        <PriceBreakdown
          cartValue={cartValue as number}
          surcharge={surcharge}
          deliveryFee={deliveryFee}
          deliveryDistance={deliveryDistance}
          totalPrice={totalPrice}
        />
      </div>

      {/* <div>
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
      </div> */}
    </div>
  );
};

export default Calculator;
