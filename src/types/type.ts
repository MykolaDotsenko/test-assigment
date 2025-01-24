export interface InputFieldsProps {
  venueSlug: string;
  setVenueSlug: (value: string) => void;
  cartValue: number | "";
  setCartValue: (value: number | "") => void;
  latitude: number | "";
  setLatitude: (value: number | "") => void;
  longitude: number | "";
  setLongitude: (value: number | "") => void;
  handleLocation: () => void;
  errors?: {
    venueSlug?: string;
    cartValue?: string;
    latitude?: string;
    longitude?: string;
  };
}

export interface PriceBreakdownProps {
  cartValue: number;            
  surcharge: number;            
  deliveryFee: number;          
  totalPrice: number;           
  deliveryDistance: number;     
}


export interface ErrorMessageProps {
  message: string;
}


export interface VenueStaticData {
  venue_raw: {
    location: {
      coordinates: [number, number]; 
    };
  };
}

export interface DistanceRange {
  min: number;  
  max: number;  
  a: number;    
  b: number;    
  flag: null | string;
}

export interface VenueDynamicData {
  venue_raw: {
    delivery_specs: {
      order_minimum_no_surcharge: number; 
      delivery_pricing: {
        base_price: number;             
        distance_ranges: DistanceRange[];
      };
    };
  };
}
