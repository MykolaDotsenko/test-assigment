import  { FC } from "react";
import { InputFieldsProps } from "../types/type";

const InputFields: FC<InputFieldsProps> = ({
  venueSlug,
  setVenueSlug,
  cartValue,
  setCartValue,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  handleLocation,
  errors,
}) => {
  return (
    <div>
      {/* Venue Slug */}
      <label>
        Venue slug
        <input
          data-test-id="venueSlug"
          type="text"
          value={venueSlug}
          onChange={(e) => setVenueSlug(e.target.value)}
        />
        {errors?.venueSlug && <p style={{ color: "red" }}>{errors.venueSlug}</p>}
      </label>

      {/* Cart Value (EUR) */}
      <label>
        Cart Value (EUR)
        <input
          data-test-id="cartValue"
          type="number"
          step="0.01"
          value={cartValue}
          onChange={(e) =>
            setCartValue(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
        {errors?.cartValue && <p style={{ color: "red" }}>{errors.cartValue}</p>}
      </label>

      {/* Latitude */}
      <label>
        User Latitude
        <input
          data-test-id="userLatitude"
          type="number"
          step="0.000001"
          value={latitude}
          onChange={(e) =>
            setLatitude(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
        {errors?.latitude && <p style={{ color: "red" }}>{errors.latitude}</p>}
      </label>

      {/* Longitude */}
      <label>
        User Longitude
        <input
          data-test-id="userLongitude"
          type="number"
          step="0.000001"
          value={longitude}
          onChange={(e) =>
            setLongitude(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
        {errors?.longitude && <p style={{ color: "red" }}>{errors.longitude}</p>}
      </label>

      {/* Get location button */}
      <button data-test-id="getLocation" onClick={handleLocation}>
        Get Location
      </button>
    </div>
  );
};

export default InputFields;
