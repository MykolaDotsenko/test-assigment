import { render, screen, fireEvent } from "@testing-library/react";
import Calculator from "../components/Calculator";

describe("Delivery Order Price Calculator", () => {
  test("renders input fields and calculates price", async () => {
    render(<Calculator />);

    const venueSlugInput = screen.getByTestId("venueSlug");
    const cartValueInput = screen.getByTestId("cartValue");
    const userLatInput = screen.getByTestId("userLatitude");
    const userLonInput = screen.getByTestId("userLongitude");
    const calcButton = screen.getByRole("button", {
      name: /calculate delivery price/i,
    });

    fireEvent.change(venueSlugInput, {
      target: { value: "home-assignment-venue-helsinki" },
    });
    fireEvent.change(cartValueInput, { target: { value: "10" } });
    fireEvent.change(userLatInput, { target: { value: "60.17094" } });
    fireEvent.change(userLonInput, { target: { value: "24.93087" } });

    fireEvent.click(calcButton);
  });
});
