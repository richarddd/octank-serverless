import { render, screen } from "@testing-library/react";
import React from "react";

import App from "./App";

test("renders title", () => {
  const app = render(<App />);
  const title = screen.getByText(/octank/i);
  expect(title).toBeInTheDocument();
});
