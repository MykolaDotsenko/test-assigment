import { FC } from "react";
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
    <div className="border border-gray-300 p-4 rounded-lg bg-white w-full max-w-md mx-auto">
    
      <div className="space-y-4">
        {/* Venue Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Venue slug
          </label>
          <input
            data-test-id="venueSlug"
            type="text"
            value={venueSlug}
            onChange={(e) => setVenueSlug(e.target.value)}
            list="venue-slug-options"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="venue-slug-options">
            <option value="home-assignment-venue-helsinki" />
          </datalist>
          {errors?.venueSlug && (
            <p className="text-sm text-red-600 mt-1">{errors.venueSlug}</p>
          )}
        </div>

        {/* Cart Value (EUR) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cart Value (EUR)
          </label>
          <input
            data-test-id="cartValue"
            type="number"
            step="0.01"
            value={cartValue}
            onChange={(e) =>
              setCartValue(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors?.cartValue && (
            <p className="text-sm text-red-600 mt-1">{errors.cartValue}</p>
          )}
        </div>

        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            User Latitude
          </label>
          <input
            data-test-id="userLatitude"
            type="number"
            step="0.000001"
            value={latitude}
            onChange={(e) =>
              setLatitude(e.target.value === "" ? "" : Number(e.target.value))
            }
            list="user-lat-options"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="user-lat-options">
            <option value="60.17094" />
          </datalist>
          {errors?.latitude && (
            <p className="text-sm text-red-600 mt-1">{errors.latitude}</p>
          )}
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            User Longitude
          </label>
          <input
            data-test-id="userLongitude"
            type="number"
            step="0.000001"
            value={longitude}
            onChange={(e) =>
              setLongitude(e.target.value === "" ? "" : Number(e.target.value))
            }
            list="user-lon-options"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="user-lon-options">
            <option value="24.93087" />
          </datalist>
          {errors?.longitude && (
            <p className="text-sm text-red-600 mt-1">{errors.longitude}</p>
          )}
        </div>

        {/* Get location button */}
        <div>
          <button
            data-test-id="getLocation"
            type="button"
            onClick={handleLocation}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"

          >
            Get Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputFields;
