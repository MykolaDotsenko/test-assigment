export interface InputFieldsProps {
  venueSlug: string;
  setVenueSlug: (value: string) => void;
  cartValue: number | "";
  setCartValue: (value: number | "") => void;
  latitude: number | "";
  setLatitude: (value: number) => void;
  longitude: number | "";
  setLongitude: (value: number) => void;
  handleLocation: () => void;
}

export interface PriceBreakdownProps {
  cartValue: number;
  surcharge: number;
  deliveryFee: number;
  totalPrice: number;
  deliveryDistance: number;
}
