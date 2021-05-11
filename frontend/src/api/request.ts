import axios from "axios";

import jwt from "../jwt";

const request = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

request.interceptors.request.use(async (config) => {
  const token = jwt.token;
  if (token) {
    config.headers.common["Authorization"] = token;
    if (!config.headers["options"]) {
      config.headers["options"] = {};
    }
    config.headers["options"]["Authorization"] = token;
  }
  if (config.data !== null && typeof config.data === "object") {
    ["common", "patch", "post", "put"].forEach((method) => {
      config.headers[method]["Content-Type"] = "application/json";
    });
  }

  return config;
});

request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    console.error(error);
    throw error;
  }
);

export default request;
