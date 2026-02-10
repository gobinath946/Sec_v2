import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Footer from "../Footer/Footer";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../config";
import axios from "axios";
import AjmAgreement from "./AjmAgreement";
import { useNavigate } from "react-router-dom";
import ImageDistributor from "../ImagesProvider/ImageDistributor";
import { Typography, Link, useMediaQuery } from "@mui/material";
import AjmHubspot from "./AjmHubspot/AjmHubspot";
import AjmInsurance from "./AjmInsurance/AjmInsurance";
import AjmAutosure from "./AjmAutosure/AjmAutosure";

const Ajm = () => {
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
            {customerData.message_custom_data &&
              customerData.message_custom_data.Ajm_Data && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    height: "100%",
                    padding: "10px",
                  }}
                >
                  {customerData.message_custom_data &&
                    customerData.message_custom_data.Ajm_Data && (
                      <Paper
                        elevation={2}
                        sx={{
                          width: "100%",
                          maxWidth: isSmallScreen ? "100vw" : "60vw",
                          borderRadius: "10px",
                          height: "auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "5px",
                          border: "2px solid red",
                          // borderImage: "linear-gradient(40deg, red 25%, black 25%, black 75%, red 75%) 1",
                        }}
                      >
                        <Grid
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px",
                          }}
                        >
                          <ImageDistributor
                            uid={customerData.customer_id}
                            logo={"Main_Logo"}
                            width={isSmallScreen ? "30%" : "25%"}
                            height={"auto"}
                          />
                          <Grid sx={{ maxWidth: "300px" }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "10px", sm: "12px" },
                              }}
                            >
                              Tax Invoice
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "10px", sm: "12px" },
                              }}
                            >
                              <strong>Date:</strong>
                              {customerData.message_custom_data
                                ? customerData.message_custom_data.Ajm_Data
                                    .invoice_date
                                : ""}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "10px", sm: "12px" },
                              }}
                            >
                              <strong> GST Number:</strong> 132334714
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "10px", sm: "12px" },
                              }}
                            >
                              <strong>Location:</strong>{" "}
                              <a
                                href="https://www.google.com/maps/search/?api=1&query=232+Kahikatea+Drive+Frankton+Waikato+3204"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                              >
                                Shen & Friends Ltd Trading as AJ Motors Hamilton
                                Trader number M381928 232 Kahikatea Drive
                                Frankton, Waikato 3204
                              </a>
                            </Typography>

                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "10px", sm: "12px" },
                              }}
                            >
                              <strong>Phone:</strong>
                              <Link
                                href="tel:073488888"
                                sx={{
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                              >
                                07 348 8888
                              </Link>
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: { xs: "10px", sm: "12px" },
                              }}
                            >
                              <strong>Website:</strong>
                              <Link
                                href="https://www.ajmotors.co.nz"
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  textDecoration: "none",
                                  color: "inherit",
                                  ml: 1,
                                }}
                              >
                                www.ajmotors.co.nz
                              </Link>
                            </Typography>
                          </Grid>
                        </Grid>

                        {customerData.message_custom_data &&
                          customerData.message_custom_data.Ajm_Data && (
                            <AjmAgreement
                              Ajm_Data={
                                customerData.message_custom_data.Ajm_Data
                              }
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
                    )}
                </Box>
              )}

            {customerData.message_custom_data &&
              customerData.message_custom_data.Hubspot_Esign_Data && (
                <Box
                  sx={{
                    width: "100%",
                    overflowX: "auto", // Container level overflow handling
                  }}
                >
                  {customerData.message_custom_data &&
                    customerData.message_custom_data.Hubspot_Esign_Data && (
                      <Paper
                        elevation={2}
                        sx={{
                          width: "100%",
                          minWidth: "1400px",
                          // maxWidth: isSmallScreen ? "100vw" : "80vw",
                          borderRadius: "10px",
                          height: "auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "5px",
                          border: "2px solid red",
                          overflowX: "auto", // Handles horizontal overflow
                          overflowY: "auto", // Handles vertical overflow if needed
                        }}
                      >
                        {customerData.message_custom_data &&
                          customerData.message_custom_data
                            .Hubspot_Esign_Data && (
                            <AjmHubspot
                              Bwd_Data={customerData.message_custom_data}
                              id={customerData.message_externalid}
                              rec_email={sessionStorage.getItem(
                                "stepper_email"
                              )}
                              rec_mobile={customerData.recipient_mobile}
                              cus_id={customerData.customer_id}
                              rec_name={sessionStorage.getItem("stepper_email")}
                              signatureData={customerData.signatures}
                              is_readable={customerData.is_readable}
                            />
                          )}

                        <Grid sx={{ paddingBottom: "5px", marginTop: "10px" }}>
                          <Footer />
                        </Grid>
                      </Paper>
                    )}
                </Box>
              )}
            {customerData.message_custom_data &&
              customerData.message_custom_data.Ajm_Insurance_Esign && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    height: "100%",
                    padding: "10px",
                  }}
                >
                  {customerData.message_custom_data &&
                    customerData.message_custom_data.Ajm_Insurance_Esign && (
                      <Paper
                        elevation={2}
                        sx={{
                          width: "100%",
                          // maxWidth: isSmallScreen ? "100vw" : "90vw",
                          borderRadius: "10px",
                          height: "auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "2px",
                          border: "1px solid red",
                          // borderImage: "linear-gradient(40deg, red 25%, black 25%, black 75%, red 75%) 1",
                        }}
                      >
                        {customerData.message_custom_data &&
                          customerData.message_custom_data
                            .Ajm_Insurance_Esign && (
                            <AjmInsurance
                              Ajm_Data={customerData.message_custom_data}
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
                    )}
                </Box>
              )}
            {customerData.message_custom_data &&
              customerData.message_custom_data.Ajm_Autosure_Esign && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    height: "100%",
                    padding: "10px",
                  }}
                >
                  {customerData.message_custom_data &&
                    customerData.message_custom_data.Ajm_Autosure_Esign && (
                      <Paper
                        elevation={2}
                        sx={{
                          width: "100%",
                          // maxWidth: isSmallScreen ? "100vw" : "90vw",
                          borderRadius: "10px",
                          height: "auto",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          padding: "2px",
                          border: "1px solid red",
                          // borderImage: "linear-gradient(40deg, red 25%, black 25%, black 75%, red 75%) 1",
                        }}
                      >
                        {customerData.message_custom_data &&
                          customerData.message_custom_data
                            .Ajm_Autosure_Esign && (
                            <AjmAutosure
                              Ajm_Data={customerData.message_custom_data}
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
                    )}
                </Box>
              )}
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default Ajm;
