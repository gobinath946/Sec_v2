import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Footer from "../Footer/Footer";
import { useParams } from "react-router-dom";
import { BASE_URL } from "../../config";
import axios from "axios";
import RentalListing from "./RentalListing";
import GeneralListing from "./GeneralListing";
import { useNavigate } from "react-router-dom";
import ImageDistributor from "../ImagesProvider/ImageDistributor";
import { Typography, Link, useMediaQuery } from "@mui/material";

const Sbho = () => {
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
        if (
          error.response &&
          error.response.data &&
          error.response.data.message === "Data not found For Provided Uid"
        ) {
          navigate(`/result/error/${Tempname}Result`);
        } else {
          console.error("Error fetching data:", error);
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
                  maxWidth: "1200px",
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
                    justifyContent: "center",
                    paddingBottom: "15px",
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
                      width={isSmallScreen ? "30%" : "45%"}
                      height={"auto"}
                    />
                    <Grid>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "10px", sm: "12px" },
                        }}
                      >
                        <strong>E-License No:</strong> 3906526
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "10px", sm: "12px" },
                        }}
                      >
                        <strong>ABN:</strong> 94 608 210 920
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "10px", sm: "12px" },
                        }}
                      >
                        <strong>Company:</strong> WAADII PTY LTD
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "10px", sm: "12px" },
                        }}
                      >
                        <strong>Agent:</strong>
                        <Link
                          href="https://www.saleByHomeOwner.com.au"
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textDecoration: "none", color: "inherit" }}
                        >
                          SaleByHomeOwner.com.au
                        </Link>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "10px", sm: "12px" },
                        }}
                      >
                        <strong>Phone:</strong>
                        <Link
                          href="tel:1300609392"
                          sx={{ textDecoration: "none", color: "inherit" }}
                        >
                          1300 609 392
                        </Link>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "10px", sm: "12px" },
                        }}
                      >
                        <strong>E-mail:</strong>
                        <Link
                          href="mailto:admin@salebyhomeowner.com.au"
                          sx={{
                            textDecoration: "none",
                            color: "inherit",
                            ml: 1,
                          }} // Added ml for margin-left
                        >
                          admin@SaleByHomeOwner.com.au
                        </Link>
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "10px", sm: "12px" },
                        }}
                      >
                        <strong> Postal Address:</strong>

                        <Link
                          href="https://www.google.com/maps?q=GPO+BOX+2002,+Brisbane+QLD+4000"
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textDecoration: "none", color: "inherit" }}
                        >
                          GPO BOX 2002, Brisbane QLD 4000
                        </Link>
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>

                {customerData.message_custom_data &&
                  customerData.message_custom_data.General_Lisiting && (
                    <GeneralListing
                      General_Lisiting={
                        customerData.message_custom_data.General_Lisiting
                      }
                      id={customerData.message_externalid}
                      rec_email={customerData.recipient_email}
                      rec_mobile={customerData.recipient_mobile}
                      cus_id={customerData.customer_id}
                      rec_name={customerData.recipient_name}
                      signatureData={customerData.signatures}
                    />
                  )}
                {customerData.message_custom_data &&
                  customerData.message_custom_data.Rental_Lisiting && (
                    <RentalListing
                      Rental_Lisiting={
                        customerData.message_custom_data.Rental_Lisiting
                      }
                      id={customerData.message_externalid}
                      rec_email={customerData.recipient_email}
                      rec_mobile={customerData.recipient_mobile}
                      cus_id={customerData.customer_id}
                      rec_name={customerData.recipient_name}
                      signatureData={customerData.signatures}
                    />
                  )}

                <Grid sx={{ paddingBottom: "5px",marginTop:"10px" }}>
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

export default Sbho;
