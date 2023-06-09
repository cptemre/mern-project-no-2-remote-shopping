//* UTILITIES
// INTERFACES - DEFAULT STATE INTERFACE
import { InitialStateInterface } from "../interfaces/local-data/initialStateInterface";
// DEFAULT STATE - LOCAL VARIABLES
import {
  defaultFetchUrl,
  categories,
  subCategories,
  underlineWidth1,
  underlineWidth2,
  transitionMs,
  selectedOption,
  selectedSubOption,
  allOptions,
  acceptableCurrencies,
  selectedCurrency,
} from "./initialStateVariables";

const initialState: InitialStateInterface = {
  category: {
    categories,
    subCategories,
  },
  options: {
    allOptions,
    selectedOption,
    selectedSubOption,
  },
  booleans: {
    isRegisterButton: false,
    isForgotPassword: false,
    isLogged: false,
    isError: false,
    isOptionButton: false,
  },
  css: {
    underlineWidth1,
    underlineWidth2,
    transitionMs,
  },
  urls: {
    defaultFetchUrl,
    product: {
      get: defaultFetchUrl + "product/",
    },
  },
  payments: {
    acceptableCurrencies,
    selectedCurrency,
  },
};

export default initialState;
