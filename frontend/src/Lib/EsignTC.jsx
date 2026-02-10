import React from "react";
import { Grid, Typography,Box,Paper} from "@mui/material";
import log5 from "../Assets/Images/Securegateway-Gradient.png";
import log6 from "../Assets/Images/ErpAppsLogo.png";

const EsignTC = () => {

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
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
                bgcolor="white"
                sx={{
                  width: "100%",
                  maxWidth: "800px",
                  borderRadius: "10px",
                  height: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  padding: "5px",
                }}
              >

        
        <Grid container spacing={2} sx={{ width: "100%", padding: "20px" }}>
          <Grid
            container
            sx={{
              alignItems: "center",
              width: "100%",
              marginTop: "30px",
              padding: "10px",
            }}
          >
            <Grid
              item
              xs={6}
              sm={6}
              md={6}
              lg={6}
              xl={6}
              sx={{ display: "flex", justifyContent: "flex-start" }}
            >
              <img
                src={log6}
                alt="ERP Apps Logo"
                style={{ height: "auto", width: "150px" }}
              />
            </Grid>

            <Grid
              item
              xs={6}
              sm={6}
              md={6}
              lg={6}
              xl={6}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <img
                src={log5}
                alt="Secure Gateway Logo"
                style={{ height: "auto", width: "150px" }}
              />
            </Grid>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "center",
              marginTop: "5px",
            }}
          >
            <Typography
              sx={{
                fontWeight: "800",
                fontSize: {
                  xs: "13.5px",
                  sm: "15px",
                  fontFamily: "Times New Roman, Times, serif",
                },
              }}
            >
              Terms and Conditions for E-Signatures <br />
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "left",
              marginTop: "5px",
            }}
          >
            <Grid
              item
              xs={12}
              sx={{
                textAlign: "left",
                marginTop: "5px",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                <span style={{ fontWeight: 800 }}>1. </span> Introduction
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                These Terms and Conditions ("Terms") govern the use of
                electronic signatures for transactions and communications with
                ERP APPS PTY LTD in Australia and New Zealand. By using our
                e-signature service, you agree to comply with these Terms.
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                textAlign: "left",
                marginTop: "5px",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                <span style={{ fontWeight: 800 }}>2. </span> Definitions
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                <span style={{ fontWeight: 800 }}>E-Signature:</span> An
                electronic sound, symbol, or process attached to or logically
                associated with a contract or other record and executed or
                adopted by a person with the intent to sign the record.
                <br />
                <span style={{ fontWeight: 800 }}>User:</span> Any individual or
                entity using the e-signature services provided by ERP APPS PTY
                LTD.
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                textAlign: "left",
                marginTop: "5px",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                <span style={{ fontWeight: 800 }}> 3. </span> Acceptance of
                Terms By using e-signatures in your transactions with ERP APPS
                PTY LTD, you agree to be bound by these Terms and acknowledge
                that electronic signatures have the same legal effect as
                handwritten signatures.
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                textAlign: "left",
                marginTop: "5px",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                <span style={{ fontWeight: 800 }}> 4. </span> Legal Framework
                This agreement is governed by:
                <br />
                Australia: Electronic Transactions Act 1999 (Cth) and
                corresponding state legislation.
                <br />
                New Zealand: Electronic Transactions Act 2002.
                <br />
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                textAlign: "left",
                marginTop: "5px",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                <span style={{ fontWeight: 800 }}> 5. </span> Use of
                E-Signatures
                <br />
                <span style={{ fontWeight: 800 }}> 5.1 Consent: </span> Users
                must provide explicit consent to use e-signatures. Consent can
                be provided electronically and is documented by ERP APPS PTY
                LTD. <br />
                <span style={{ fontWeight: 800 }}> 5.2 Validity: </span>{" "}
                E-signatures are valid for all business transactions,
                agreements, and communications unless otherwise specified by law
                or mutual agreement. <br />
                <span style={{ fontWeight: 800 }}> 5.3 Security: </span> : ERP
                APPS PTY LTD implements reasonable measures to ensure the
                security and integrity of e-signatures. Users are responsible
                for maintaining the confidentiality of their e-signature
                credentials. <br />
              </Typography>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                textAlign: "left",
                marginTop: "5px",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "13.5px",
                    sm: "15px",
                    fontFamily: "Times New Roman, Times, serif",
                  },
                }}
              >
                <span style={{ fontWeight: 800 }}> 6.</span> User
                Responsibilities <br />
                <span style={{ fontWeight: 800 }}> 6.1</span> Users must ensure
                the accuracy of the information provided in any electronically
                signed document. <br />
                <span style={{ fontWeight: 800 }}> 6.2 </span> Users must not
                share their e-signature credentials with others. . <br />
                <span style={{ fontWeight: 800 }}> 6.3 </span> Users must notify
                ERP APPS PTY LTD immediately if they suspect any unauthorized
                use of their e-signature.
                <br />
              </Typography>
            </Grid>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "left",
              marginTop: "5px",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "13.5px",
                  sm: "15px",
                  fontFamily: "Times New Roman, Times, serif",
                },
              }}
            >
              <span style={{ fontWeight: 800 }}>7.</span> ERP APPS PTY LTD
              Responsibilities <br />
              <span style={{ fontWeight: 800 }}> 7.1 </span> ERP APPS PTY LTD
              will provide a secure platform for the use of e-signatures. <br />
              <span style={{ fontWeight: 800 }}> 7.2 </span>ERP APPS PTY LTD
              will maintain records of all electronically signed documents.{" "}
              <br />
              <span style={{ fontWeight: 800 }}> 7.3 </span> ERP APPS PTY LTD
              will ensure compliance with relevant legislation in ANZ regarding
              e-signatures.
              <br />
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "left",
              marginTop: "5px",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "13.5px",
                  sm: "15px",
                  fontFamily: "Times New Roman, Times, serif",
                },
              }}
            >
              <span style={{ fontWeight: 800 }}>8.</span>Confidentiality and
              Privacy ERP APPS PTY LTD is committed to protecting the privacy of
              users. All personal information collected during the e-signature
              process will be handled in accordance with our Privacy Policy and
              relevant privacy laws in Australia and New Zealand. <br />
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "left",
              marginTop: "5px",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "13.5px",
                  sm: "15px",
                  fontFamily: "Times New Roman, Times, serif",
                },
              }}
            >
              <span style={{ fontWeight: 800 }}>9.</span>Limitation of Liability
              ERP APPS PTY LTD is not liable for any losses or damages arising
              from the use of e-signatures, including unauthorized use or errors
              in the information provided by users.
              <br />
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "left",
              marginTop: "5px",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "13.5px",
                  sm: "15px",
                  fontFamily: "Times New Roman, Times, serif",
                },
              }}
            >
              <span style={{ fontWeight: 800 }}>10.</span>Changes to Terms ERP
              APPS PTY LTD reserves the right to modify these Terms at any time.
              Users will be notified of any significant changes and continued
              use of the e-signature services constitutes acceptance of the
              revised Terms.
              <br />
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "left",
              marginTop: "5px",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "13.5px",
                  sm: "15px",
                  fontFamily: "Times New Roman, Times, serif",
                },
              }}
            >
              <span style={{ fontWeight: 800 }}>11.</span>Governing Law These
              Terms are governed by the laws of:
              <br />
              Australia: The Commonwealth of Australia.
              <br />
              New Zealand: New Zealand.
              <br />
            </Typography>
          </Grid>

          <Grid
            item
            xs={12}
            sx={{
              textAlign: "left",
              marginTop: "5px",
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "13.5px",
                  sm: "15px",
                  fontFamily: "Times New Roman, Times, serif",
                },
              }}
            >
              <span style={{ fontWeight: 800 }}>12.</span>Contact Information
              For any questions or concerns regarding these Terms, please
              contact ERP APPS PTY LTD at hi@erpapps.com.au.
              <br />
            </Typography>
          </Grid>
        </Grid>
        </Paper>
              </Box>
    </div>
  );
};

export default EsignTC;
