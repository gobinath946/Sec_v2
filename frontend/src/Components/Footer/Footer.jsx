import React from "react";
import logo from "../../Assets/Images/Securegateway-Gradient.png";

import { Grid, IconButton, Typography } from "@mui/material";
import { FaSquarePhone } from "react-icons/fa6";
import { IoMailSharp } from "react-icons/io5";

import { Link } from "@mui/material";
import CopyrightIcon from "@mui/icons-material/Copyright";

const Footer = () => {
  const tempName = sessionStorage.getItem("TempName");
  const currentYear = new Date().getFullYear();
  return (
    <>
      {tempName === "Dummy" && (
        <Grid
          container
          sx={{
            padding: "10px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Grid
            item
            xs={12}
            md={12}
            lg={4}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CopyrightIcon sx={{ fontSize: "16px", marginRight: "5px" }} />
            <Typography
              variant="body2"
              sx={{ fontSize: "13px", fontWeight: "600", marginTop: "5px" }}
            >
              {currentYear} All rights reserved
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            md={12}
            lg={4}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontSize: "13px",
                fontWeight: "600",
                marginRight: "5px",
                marginTop: "5px",
              }}
            >
              Service provided by
            </Typography>
            <a
              href="https://securegateway.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={logo} alt="logo" style={{ height: "40px" }} />
            </a>
          </Grid>
          <Grid
            item
            xs={12}
            md={12}
            lg={4}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: "13px", fontWeight: "600", marginTop: "5px" }}
            >
              Designed and developed by QRS
            </Typography>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default Footer;
