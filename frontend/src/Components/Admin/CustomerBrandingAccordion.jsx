import React, { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Grid,Button } from "@mui/material";
import BrandColorTable from "./CustomerBrandings/ColorBranding";
import LogoBranding from "./CustomerBrandings/LogoBranding";
import TemplateUpload from "./CustomerBrandings/TemplateBranding";

const componentStyles = {
  color: "#424242",
  paddingTop: "20px",
  fontSize: "18px",
  fontWeight: 600,
  fontFamily: "Inter",
  fontStyle: "normal",
  lineHeight: "22.53px",
};

const CustomerBrandingAccordion = ({ customer_id }) => {
  const id = customer_id;
  return (
    <>
      <Grid style={componentStyles}></Grid>
      <hr
        style={{ width: "100%", color: "rgb(217, 217, 217)", marginTop: "1%" }}
      />


      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Accordion sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}>
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
                Brand Colour Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <BrandColorTable uid={id} />
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12}>
          <Accordion sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}>
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
                Brand Logo Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <LogoBranding uid={id} />
            </AccordionDetails>
          </Accordion>
        </Grid>
        <Grid item xs={12}>
          <Accordion sx={{ backgroundColor: "#F2F2F2", boxShadow: "none" }}>

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
             Template Configuration
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TemplateUpload uid={id} />
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </>
  );
};

export default CustomerBrandingAccordion;
