import { Mock } from "./Mock";
import { create } from "react-test-renderer";

jest.mock("./to-be-mocked.ts", () => ({
  toBeMocked: () => "mocked",
}));

it("should render the app and properly mock files", () => {
  const renderer = create(<Mock />);
  expect(renderer.toJSON()).toEqual({
    type: "div",
    props: {},
    children: ["mocked"],
  });
});
