import React from "react";
import PayslipGenerator from "./Components/PayslipGenerator";
import { Box } from "@mui/material";

const PayslipGeneratorHome = () => {
  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <PayslipGenerator />
    </Box>
  );
};

export default PayslipGeneratorHome;
