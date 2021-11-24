import { App } from "./App";
import { create } from 'react-test-renderer'

it("should work", () => {
  const renderer = create(<App />);
  expect(renderer.toJSON()).toBeDefined()
});
