import Box from "@material-ui/core/Box";
import CircularProgress from "@material-ui/core/CircularProgress";
import React from "react";

const Spinner: React.FC = () => (
  <Box
    width="100%"
    height="100%"
    minHeight={320}
    display="flex"
    alignItems="center"
    justifyContent="center"
  >
    <CircularProgress />
  </Box>
);

export default Spinner;
