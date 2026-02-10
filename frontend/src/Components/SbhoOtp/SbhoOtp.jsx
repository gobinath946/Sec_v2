import React, { useState, useEffect } from "react";
import { Grid, Box, Paper, Typography } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import { BASE_URL } from "../../config";
import ImageDistributor from "../ImagesProvider/ImageDistributor";
import "./Otp.css";

const Otp = () => {
  const [cus_id, setCus_id] = useState(null);
  const [link, setLink] = useState(null);
  const navigate = useNavigate();
  const uid = sessionStorage.getItem("uid");
  const Tempname = sessionStorage.getItem("TempName");
  const [OtpPageBranding, setOtpPageBranding] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/message/${uid}`);
        const data = response.data.message;
        const branding = response.data.branding;
        const OtpPageBranding = branding.branding_color.find(
          (brand) => brand.page_name === "Otp_Page"
        );
        setOtpPageBranding(OtpPageBranding);
        if (data === null) {
          navigate(`/result/error/${Tempname}Result`);
        } else {
          setCus_id(data.customer_id);
          const shortenLink = data.shorten_link[0].url;
          setLink(shortenLink);
        }
      } catch (error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message === "Data not found For Provided Uid"
        ) {
          navigate(`/result/error/${Tempname}Result`);
        } else {
          navigate(`/result/error/${Tempname}Result`);
        }
      }
    };

    fetchData();
  }, [uid, Tempname, navigate]);

  return (
    <div id="Otp_Main">
      <Grid container>
        <Grid item xs={12} sm={2} lg={3}></Grid>

        <Grid
          item
          xs={12}
          sm={8}
          lg={6}
          className="Otp_Sub1"
          sx={{
            marginTop: "10px",
            marginLeft: { xs: "10px" },
            marginRight: { xs: "10px" },
          }}
        >
          <Paper
            elevation={2}
            bgcolor="white"
            sx={{
              width: "100%",
              maxWidth: "600px",
              textAlign: "center",
              borderRadius: "10px",
              height: "97vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Grid sx={{ padding: "20px" }}>
              <Grid container justifyContent="center">
                <ImageDistributor
                  uid={cus_id}
                  logo={"Main_Logo"}
                  width={"50%"}
                  height={"auto"}
                />
              </Grid>
            </Grid>
            <Grid sx={{ padding: "20px" }}>
              <Grid container>
                <Grid item xs={12} sm={1}></Grid>
                <Grid item xs={12} sm={10}>
                  <Box
                    sx={{
                      border: `1px solid ${
                        OtpPageBranding
                          ? OtpPageBranding.styles.box_border.color
                          : ""
                      }`,
                      borderRadius: "3px",
                    }}
                  >
                    <Grid sx={{ padding: "10px" }} >
                     <Typography sx={{fontWeight:"600"}}>
                     Oops, looks like you have lost the link.{" "}
                      <a href={link} rel="noopener noreferrer" style={{textDecoration:"none",color:"green"}}>
                        Click here
                      </a>{" "}
                      and try again.
                     </Typography>
                    </Grid>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={1}></Grid>
              </Grid>
            </Grid>

            <Grid sx={{ paddingBottom: "20px", marginTop: "10px" }}>
              <Footer />
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={2} lg={3}></Grid>
      </Grid>
    </div>
  );
};

export default Otp;
