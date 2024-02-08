import axios from "axios";

// function createBaseUrl() {
//   const { origin } = window.location;
//   if (
//     process?.env?.NODE_ENV === "development" &&
//     process?.env?.REACT_APP_BASE_URL
//   ) {
//     return process.env.REACT_APP_BASE_URL;
//   }
//   return origin;
// }

// axios.defaults.baseURL = createBaseUrl();

export default axios;
