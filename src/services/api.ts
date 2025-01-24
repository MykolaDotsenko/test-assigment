import axios from "axios";
import { VenueStaticData, VenueDynamicData } from "../types/type";

const BASE_URL =
  "https://consumer-api.development.dev.woltapi.com/home-assignment-api/v1/venues";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// fetch venue static data
export async function fetchVenueStaticData(
  venueSlug: string
): Promise<VenueStaticData> {
  const response = await apiClient.get(`/${venueSlug}/static`);
  return response.data;
}

// fetch venue dynamic data
export async function fetchVenueDynamicData(
  venueSlug: string
): Promise<VenueDynamicData> {
  const response = await apiClient.get(`/${venueSlug}/dynamic`);
  return response.data;
}
