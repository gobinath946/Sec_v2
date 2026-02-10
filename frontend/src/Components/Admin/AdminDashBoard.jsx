import React from "react";
import { Grid,} from "@mui/material";

import DashBoard from "./CustomerDashBoard/DashBoard";

const AdminDashBoard = () => {

  const userUid = sessionStorage.getItem("userUid");

  return (
    <Grid>
      <DashBoard uid={userUid} />
    </Grid>
  );
};

export default AdminDashBoard;
