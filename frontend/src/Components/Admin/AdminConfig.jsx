import React from "react";
import { Container } from "@mui/material";
import CustomerSettingAccordion from "./CustomerSettingsAccordion";

const AdminConfig = () => {

  const user_uid = sessionStorage.getItem("userUid");
  
  return (
    <Container>
      <CustomerSettingAccordion customer_id={user_uid} />
    </Container>
  );
};

export default AdminConfig;
