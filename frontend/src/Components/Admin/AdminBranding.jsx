import React from "react";
import { Container } from "@mui/material";
import CustomerBrandingAccordion from "./CustomerBrandingAccordion";

const AdminBranding = () => {
  const user_uid = sessionStorage.getItem("userUid");
  return (
    <Container>
      <CustomerBrandingAccordion customer_id={user_uid} />
    </Container>
  );
};

export default AdminBranding;
