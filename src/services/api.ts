import axios from "axios";

const BASE_URL =
  "https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues";

export const fetchVenueStaticData = async (venueSlug: string) => {
  const response = await axios.get(`${BASE_URL}/${venueSlug}/static`);
  console.log("The FETCH STATIC output:", response.data);
  return response.data.venue_raw.location.coordinates;
};

export const fetchVenueDynamicData = async (venueSlug: string) => {
  const response = await axios.get(`${BASE_URL}/${venueSlug}/dynamic`);
  console.log("The FETCH DYNAMIC output:", response.data);
  return response.data.venue_raw.delivery_specs;
};
