import React from "react";
import axios from "./utils/addons";
import CircularProgress from "@material-ui/core/CircularProgress";
import Backdrop from "@mui/material/Backdrop";

const { useState, useMemo, useEffect } = React;

const useAxiosLoader = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const inc = (mod) => setCounter((c) => c + mod);

    const handleRequest = (config) => (inc(1), config);
    const handleResponse = (response) => (inc(-1), response);
    const handleError = (error) => (inc(-1), Promise.reject(error));

    // add request interceptors
    const reqInterceptor = axios.interceptors.request.use(
      handleRequest,
      handleError
    );
    // add response interceptors
    const resInterceptor = axios.interceptors.response.use(
      handleResponse,
      handleError
    );
    return () => {
      // remove all intercepts when done
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  return counter > 0;
};

const GlobalLoader = () => {
  const loading = useAxiosLoader();

  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={loading}
    >
      <CircularProgress />
    </Backdrop>
  );
};

export default GlobalLoader;
