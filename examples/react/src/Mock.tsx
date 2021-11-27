import React from "react";

import { toBeMocked } from "./to-be-mocked";

export function Mock() {
  return <div>{toBeMocked()}</div>;
}
