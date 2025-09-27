import type { AppConfiguration } from "../types";

export const CONFIG_STORAGE_KEY = "fuel-tracker:configuration";

export const DEFAULT_CONFIGURATION: AppConfiguration = {
  currencyCode: "USD",
};
