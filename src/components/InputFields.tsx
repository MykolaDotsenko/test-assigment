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
}) => {
  return (
    <div>
      <div>
        <input
          type="text"
          value={venueSlug}
          onChange={(e) => setVenueSlug(e.target.value)}
          name=""
          id=""
        />
      </div>
      <div>
        <input
          type="number"
          value={cartValue}
          onChange={(e) => setCartValue(Number(e.target.value))}
          name=""
          id=""
        />
      </div>
      <div>
        <input
          type="number"
          value={latitude}
          onChange={(e) => setLatitude(Number(e.target.value))}
          name=""
          id=""
        />
      </div>
      <div>
        <input
          type="number"
          value={longitude}
          onChange={(e) => setLongitude(Number(e.target.value))}
          name=""
          id=""
        />
      </div>
      <button onClick={handleLocation}>start</button>
    </div>
  );
};

export default InputFields;
