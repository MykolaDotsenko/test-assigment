import { useState } from "react";
import { calcDeliv, calcSmallOrder, calcTotal } from "../utils/calculations";
import { fetchVenueStaticData, fetchVenueDynamicData } from "../services/api";
import InputFields from "./InputFields";
import PriceBreakdown from "./PriceBreakdown";

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
  //   const [priceBreakdown, setPriceBreakdown] = useState({
  //     cartValue: "0,00 €",
  //     deliveryFee: "0,00 €",
  //     deliveryDistance: "0 m",
  //     smallOrderSurcharge: "0,00 €",
  //     totalPrice: "0,00 €",
  //   });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !venueSlug ||
      cartValue === "" ||
      userLatitude === "" ||
      userLongitude === ""
    ) {
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

      setVenueSlug(staticData.venue.name);
      setCartValue(staticData.order_minimum || 0);
      const calcSurcharge = calcSmallOrder(cartValue as number);
      const calcDeliveryFee = calcDeliv(dynamicData.delivery_distance);
      const calcTotalPrice = calcTotal(
        cartValue as number,
        calcSurcharge,
        calcDeliveryFee
      );

      setSurcharge(calcSurcharge);
      setDeliveryFee(calcDeliveryFee);
      setTotalPrice(calcTotalPrice);
    } catch (error) {
      console.error("Error fetching venue data:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-sm">
      <h1 className="text-2xl font-bold mb-6">
        Delivery Order Price Calculator
      </h1>

      <form action="">
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
        <PriceBreakdown />
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
