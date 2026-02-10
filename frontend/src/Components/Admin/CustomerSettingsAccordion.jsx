import React, { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Grid } from "@mui/material";
import EmailConfig from "./CustomerConfigs/EmailConfig";
import FileConfig from "./CustomerConfigs/FileConfig";
import OtherConfig from "./CustomerConfigs/OtherConfig";
import OtpConfig from "./CustomerConfigs/OtpConfig";
import PageConfig from "./CustomerConfigs/PageConfig";
import SmsConfig from "./CustomerConfigs/SmsConfig";



import { useSnackbar } from "notistack";
import { apiEndPoint } from "../../Service/ApiConstant";
import Controller from "../../Service/ApiController";

const componentStyles = {
  color: "#424242",
  paddingTop: "20px",
  fontSize: "18px",
  fontWeight: 600,
  fontFamily: "Inter",
  fontStyle: "normal",
  lineHeight: "22.53px",
};

const CustomerSettingAccordion = ({ customer_id }) => {
  const id = customer_id;
  const [customer, setCustomers] = useState([]);
  const [emailData, setEmailData] = useState({});
  const [smsData, setSmsData] = useState({});
  const [pageData, setPageData] = useState([]);
  const [otpData, setOtpData] = useState({});
  const [fileData, setFileData] = useState([]);
  const [otherData, setOtherData] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  const role = sessionStorage.getItem("Role");


  const fetchData = async () => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.CUSTOMER_DATA + id,
        "GET",
      );
      if (result.success === true) {
        setCustomers(result.data.customer)
      } else {
        enqueueSnackbar(`${result.data}`, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      console.error("Customer Setting", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEmailDataUpdate = () => {
    fetchData();
  };
  const handleSMSDataUpdate = () => {
    fetchData();
  };
  const handlePageDataUpdate = () => {
    fetchData();
  };
  const handleOTPDataUpdate = () => {
    fetchData();
  };
  const handleFileDataUpdate = () => {
    fetchData();
  };
  const handleOtherDataUpdate = () => {
    fetchData();
  };

  const handleEmailChange = (event, isExpanded) => {
    if (isExpanded) {
      setEmailData(customer.email_configuration);
    }
  };

  const handleSmsChange = (event, isExpanded) => {
    if (isExpanded) {
      setSmsData(customer.sms_configuration);
    }
  };

  const handlePageChange = (event, isExpanded) => {
    if (isExpanded) {
      setPageData(customer.page_configuration);
    }
  };

  const handleOtpChange = (event, isExpanded) => {
    if (isExpanded) {
      setOtpData(customer.otp_configuration);
    }
  };

  const handleFileChange = (event, isExpanded) => {
    if (isExpanded) {
      setFileData(customer.file_configuration);
    }
  };

  const handleOtherChange = (event, isExpanded) => {
    if (isExpanded) {
      const {
        name,
        email,
        mobile,
        email_configuration,
        sms_configuration,
        otp_configuration,
        file_configuration,
        page_configuration,
        ...otherData
      } = customer;
      setOtherData(otherData);
    }
  };

  return (
    <>
      <Grid style={componentStyles}></Grid>
      <hr
        style={{ width: "100%", color: "rgb(217, 217, 217)", marginTop: "1%" }}
      />

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Accordion
            sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}
            onChange={handleEmailChange}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  style={{
                    outlineStyle: "solid",
                    borderRadius: "50%",
                    backgroundColor: "#0056CE",
                    color: "#FFFFFF",
                  }}
                />
              }
              aria-controls="panel2a-content"
              id="panel2a-header"
            >
              <Typography
                style={{
                  fontSize: "19px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                }}
              >
                Email Services
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <EmailConfig
                data={emailData}
                uid={customer.uid}
                onDataUpdate={handleEmailDataUpdate}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Accordion
            sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}
            onChange={handleSmsChange}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  style={{
                    outlineStyle: "solid",
                    borderRadius: "50%",
                    backgroundColor: "#0056CE",
                    color: "#FFFFFF",
                  }}
                />
              }
              aria-controls="panel3a-content"
              id="panel3a-header"
            >
              <Typography
                style={{
                  fontSize: "19px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                }}
              >
                SMS Services
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <SmsConfig
                data={smsData}
                uid={customer.uid}
                onDataUpdate={handleSMSDataUpdate}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Accordion
            sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}
            onChange={handleFileChange}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  style={{
                    outlineStyle: "solid",
                    borderRadius: "50%",
                    backgroundColor: "#0056CE",
                    color: "#FFFFFF",
                  }}
                />
              }
              aria-controls="panel3a-content"
              id="panel3a-header"
            >
              <Typography
                style={{
                  fontSize: "19px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                }}
              >
                File Services
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FileConfig
                data={fileData}
                uid={customer.uid}
                onDataUpdate={handleFileDataUpdate}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          <Accordion
            sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}
            onChange={handlePageChange}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  style={{
                    outlineStyle: "solid",
                    borderRadius: "50%",
                    backgroundColor: "#0056CE",
                    color: "#FFFFFF",
                  }}
                />
              }
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography
                style={{
                  fontSize: "19px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                }}
              >
                Page Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <PageConfig
                data={pageData}
                uid={customer.uid}
                onDataUpdate={handlePageDataUpdate}
              />
            </AccordionDetails>
          </Accordion>
        </Grid>

        {role === "superadmin" && (
          <Grid item xs={12}>
            <Accordion
              sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}
              onChange={handleOtpChange}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    style={{
                      outlineStyle: "solid",
                      borderRadius: "50%",
                      backgroundColor: "#0056CE",
                      color: "#FFFFFF",
                    }}
                  />
                }
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography
                  style={{
                    fontSize: "19px",
                    fontWeight: "600",
                    fontFamily: "Inter",
                  }}
                >
                  OTP Configuration
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <OtpConfig
                  data={otpData}
                  uid={customer.uid}
                  onDataUpdate={handleOTPDataUpdate}
                />
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
        
        {role === "superadmin" && (
          <Grid item xs={12}>
            <Accordion
              sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}
              onChange={handleOtherChange}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    style={{
                      outlineStyle: "solid",
                      borderRadius: "50%",
                      backgroundColor: "#0056CE",
                      color: "#FFFFFF",
                    }}
                  />
                }
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography
                  style={{
                    fontSize: "19px",
                    fontWeight: "600",
                    fontFamily: "Inter",
                  }}
                >
                  Other Configuration
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <OtherConfig
                  data={otherData}
                  uid={customer.uid}
                  onDataUpdate={handleOtherDataUpdate}
                />
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default CustomerSettingAccordion;
