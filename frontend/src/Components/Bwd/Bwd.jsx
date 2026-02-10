import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Footer from "../Footer/Footer";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ImageDistributor from "../ImagesProvider/ImageDistributor";
import { Typography, Link, useMediaQuery } from "@mui/material";
import BwdQuote from "./BwdQuote/BwdQuote";
import BwdEsign from "./BwdEsign/BwdEsign";

const Bwd = () => {
  const { uid } = useParams();
  const [customerData, setCustomerData] = useState(null);
  const Tempname = sessionStorage.getItem("TempName");
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/message/${uid}`);
        const data = response.data.message;
        setCustomerData(data);
      } catch (error) {
        console.log(error);
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
  }, [uid, navigate]);

  return (
    <>
      <Grid container sx={{ height: "100vh" }}>
        {customerData && (
          <Grid item xs={12}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                height: "100%",
                padding: "10px",
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  width: "100%",
                  maxWidth: isSmallScreen ? "100vw" : "100vw",
                  borderRadius: "10px",
                  height: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "5px",
                  border: "2px solid #0f0067",
                  // borderImage: "linear-gradient(40deg, red 25%, black 25%, black 75%, red 75%) 1",
                }}
              >
                {customerData.message_custom_data &&
                  customerData.message_custom_data.Bwd_Quote && (
                    <BwdQuote
                      quoteData={customerData.message_custom_data}
                      msg_id={customerData.message_externalid}
                      uid={customerData.customer_id}
                      is_readable={customerData.is_readable}
                    />
                  )}

                {customerData.message_custom_data &&
                  customerData.message_custom_data.Bwd_Esign && (
                    <BwdEsign
                      Bwd_Data={customerData.message_custom_data}
                      id={customerData.message_externalid}
                      rec_email={customerData.recipient_email}
                      rec_mobile={customerData.recipient_mobile}
                      cus_id={customerData.customer_id}
                      rec_name={customerData.recipient_name}
                      signatureData={customerData.signatures}
                      is_readable={customerData.is_readable}
                    />
                  )}

                <Grid sx={{ paddingBottom: "5px", marginTop: "10px" }}>
                  <Footer />
                </Grid>
              </Paper>
            </Box>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default Bwd;
