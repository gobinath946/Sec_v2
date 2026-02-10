import React, { useRef, useState } from "react";
import { Button, TextField, Grid, Typography, IconButton } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Link,
  TableRow,
  Paper,
  Box,
  Modal,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { RotateSpinner } from "react-spinners-kit";
import { useParams } from "react-router-dom";
import {
  Add as AddIcon,
  RemoveCircle as RemoveCircleIcon,
} from "@mui/icons-material";

import SignaturePad from "../../Lib/SignaturePad";
import logo from "./FormAssets/ajm_logo.jpg";
import { useSnackbar } from "notistack";
import { BASE_URL } from "../../config";
import { poppinsRegularBase64 } from "../../Lib/Signature_Fonts/Base64/poppins";

const AjmAgreement = ({
  Ajm_Data,
  id,
  rec_email,
  rec_mobile,
  cus_id,
  rec_name,
  signatureData,
  is_readable,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [RentalListingData, setRentalListingData] = useState(Ajm_Data);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const Tempname = sessionStorage.getItem("TempName");
  const [download, setDownload] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { uid } = useParams();
  const [signatures, setSignatures] = useState([]);
  const [signaturesData, setSignaturesData] = useState(signatureData);
  const [open, setOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);

  const validateSignatures = (signatures) => {
    return signatures.every((sig) => sig.data && sig.data.length > 3500);
  };

  const handleAddSignature = () => {
    // Early validation of required data
    if (!RentalListingData?.no_of_signs) {
      enqueueSnackbar("Missing signature limit configuration", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" }
      });
      return;
    }
  
    // Calculate available slots
    const existingSignatures = Array.isArray(signatureData) ? signatureData.length : 0;
    const totalAllowedSigns = Number(RentalListingData.no_of_signs);
    const remainingSlots = Math.max(0, totalAllowedSigns - existingSignatures);
  
    // Validate if more signatures can be added
    if (signatures.length >= remainingSlots) {
      enqueueSnackbar(`Maximum ${totalAllowedSigns} signature(s) allowed`, {
        variant: "warning",
        anchorOrigin: { vertical: "bottom", horizontal: "right" }
      });
      return;
    }
  
    // Add new signature if slots are available
    setSignatures(prevSignatures => [
      ...prevSignatures,
      { id: Date.now(), data: null }
    ]);
  };

  const handleRemoveSignature = (id) => {
    setSignatures(signatures.filter((sig) => sig.id !== id));
  };

  const updateSignatures = async (dataURL, id) => {
    const currentDate = new Date().toISOString();
    const updatedSignatures = signatures.map((sig) =>
      sig.id === id ? { ...sig, data: dataURL, date: currentDate } : sig
    );

    setSignatures(updatedSignatures);
    return updatedSignatures;
  };

  const handleSignature = async (dataURL, id) => {
    const updatedSignatures = await updateSignatures(dataURL, id);
    if (validateSignatures(updatedSignatures)) {
      setIsSubmitEnabled(true);
    } else {
      setIsSubmitEnabled(false);
      enqueueSnackbar(`Provide Proper Signature Data`, {
        variant: "info",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };
  const validationSchema = Yup.object().shape({});
  const formik = useFormik({
    initialValues: {},
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const validateSignatures = (signatures) => {
        if (signatures.length === 0) {
          return false;
        }
        return signatures.every((sig) => sig.data && sig.data.length > 3500);
      };
      if (validateSignatures(signatures)) {
        setIsSubmitEnabled(true);
      } else {
        setIsSubmitEnabled(false);
        enqueueSnackbar(`Provide Proper Signature Data`, {
          variant: "info",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        setLoading(false);
        return;
      }
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add custom fonts if needed
      doc.addFileToVFS("Poppins-Regular.ttf", poppinsRegularBase64);
      doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
      doc.setFont("Poppins");

      // Header and Footer Function
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;

      const header = (doc, pageWidth) => {
        // Company Logo
        const logoWidth = 40;
        const logoHeight = 18;
        doc.addImage(logo, "PNG", 10, 5, logoWidth, logoHeight);

        doc.setFontSize(8);

        const leftDetails = [
          "Tax Invoice",
          "Shen & Friends Ltd",
          "Trading as AJ Motors Hamilton",
          "Trader number M381928",
          "232 Kahikatea Drive Frankton,Waikato 3204",
        ];

        const rightDetails = [
          "07 348 8888",
          `Date: ${RentalListingData?.invoice_date}`,
          "www.ajmotors.co.nz",
          `GST Number: 132334714`,
        ];
        let yPosition = 5;
        leftDetails.forEach((line) => {
          doc.text(line, 100, yPosition);
          yPosition += 5;
        });
        yPosition = 5;
        rightDetails.forEach((line) => {
          doc.text(line, pageWidth - 5, yPosition, { align: "right" });
          yPosition += 5;
        });
        doc.setDrawColor(200);
        doc.line(10, 36, pageWidth - 10, 36);
        return 35;
      };
      let currentY = header(doc, pageWidth);
      // Title
      doc.setFontSize(14);
      doc.setFont("Poppins", "bold");
      doc.text("Purchase Agreement", pageWidth / 2, currentY, {
        align: "center",
      });
      currentY += 10;

      // Vendor Details
      doc.setFontSize(12);
      doc.setFont("Poppins", "bold");
      doc.text("Vendor Details", 10, currentY);
      currentY += 6;

      doc.setFontSize(8);
      doc.setFont("Poppins", "normal");
      const vendorDetails = [
        { label: "Name:", value: RentalListingData?.vendor_name || "N/A" },
        {
          label: "Address:",
          value: RentalListingData?.vendor_address || "N/A",
        },
        { label: "Email:", value: RentalListingData?.vendor_email || "N/A" },
      ];

      vendorDetails.forEach((detail) => {
        doc.setFont("Poppins", "normal");
        doc.text(detail.label, 10, currentY);
        doc.setFont("Poppins", "bold");
        doc.text(detail.value, 50, currentY);
        currentY += 6;
      });

      // Vehicle Details
      currentY += 3;
      doc.setFontSize(12);
      doc.setFont("Poppins", "bold");
      doc.text("Vehicle Details", 10, currentY);
      currentY += 6;

      doc.setFontSize(8);
      const vehicleDetailsLeft = [
        {
          label: "Registration:",
          value: RentalListingData?.vehicle_registration || "N/A",
        },
        {
          label: "Chassis:",
          value: RentalListingData?.vehicle_chassis || "N/A",
        },
        {
          label: "Odometer:",
          value: RentalListingData?.vehicle_odometer || "N/A",
        },
        {
          label: "Engine Size:",
          value: RentalListingData?.vehicle_engine_size || "N/A",
        },
        {
          label: "License Expiry:",
          value: RentalListingData?.vehicle_license_expiry || "N/A",
        },
      ];

      const vehicleDetailsRight = [
        { label: "VIN:", value: RentalListingData?.vehicle_vin || "N/A" },
        { label: "Engine:", value: RentalListingData?.vehicle_engine || "N/A" },
        { label: "Colour:", value: RentalListingData?.vehicle_colour || "N/A" },
        { label: "Fuel:", value: RentalListingData?.vehicle_fuel || "N/A" },
        {
          label: "WOF/COF Expiry:",
          value: RentalListingData?.vehicle_wof_cof_expiry || "N/A",
        },
      ];

      vehicleDetailsLeft.forEach((detail, index) => {
        doc.setFont("Poppins", "normal");
        doc.text(detail.label, 10, currentY);
        doc.setFont("Poppins", "bold");
        doc.text(detail.value, 50, currentY);

        doc.setFont("Poppins", "normal");
        doc.text(vehicleDetailsRight[index].label, 110, currentY);
        doc.setFont("Poppins", "bold");
        doc.text(vehicleDetailsRight[index].value, 150, currentY);

        currentY += 6;
      });

      currentY += 3;
      doc.setFontSize(12);
      doc.setFont("Poppins", "bold");
      doc.text("Purchase Terms and Conditions", 10, currentY);
      currentY += 6;

      doc.setFontSize(8);
      doc.setFont("Poppins", "normal");

      const termsAndConditions = [
        {
          text: "1. That you are the Vehicle's registered owner and have full authority to sell the Vehicle at the purchase price set out below.",
        },
        {
          text: "2. That the Vehicle description is correct.",
        },
        {
          text: "3. That unless noted below, the Vehicle is unencumbered and no third party has an interest in it including, but not limited to, a charge registered on the Personal Property Securities Register.",
        },
        {
          text: "4. Alternatively, if there is a charge registered against the Vehicle then you:",
          subItems: [
            "a) confirm that the amount required to release the charge is less than the Vehicle's purchase price set out below;",
            "b) allow for that amount to then be deducted from the purchase price; and",
            "c) authorise us to pay the amount required to release the charge to the Lender.",
          ],
        },
        {
          text: "5. That to the best of your knowledge the distance recorded on the odometer is true and correct.",
        },
        {
          text: "6. That the Vehicle has a current Registration and Warrant of Fitness.",
        },
        {
          text: "7. Alternatively, that should the Warrant of Fitness have expired then you authorise us to carry out any reasonable expenses required to obtain a Warrant of Fitness and for those costs to be deducted from the purchase price. We confirm that we will liaise with you in relation to any Warrant of Fitness expenses prior to them being incurred.",
        },
        {
          text: "8. That to the best of your knowledge the Vehicle:",
          subItems: [
            "a) has not been damaged in an accident or otherwise;",
            "b) has not previously been used as a taxi or rental car;",
            "c) has not previously been driven without your authority;",
            "d) has not previously been reported stolen to the police;",
            "e) has not been subjected to any flooding or water damage",
          ],
        },
      ];

      termsAndConditions.forEach((term) => {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          doc.addPage();
          header(doc);
          currentY = 35;
        }

        doc.setFontSize(8);
        doc.setFont("Poppins", "normal");
        const mainTermLines = doc.splitTextToSize(term.text, 190);
        mainTermLines.forEach((line) => {
          doc.text(line, 10, currentY);
          currentY += 6;
        });

        // Subitems if they exist
        if (term.subItems) {
          term.subItems.forEach((subItem) => {
            // Check if we need a new page
            if (currentY > pageHeight - 20) {
              doc.addPage();
              header(doc);
              currentY = 35;
            }
            doc.setFontSize(8);
            doc.setFont("Poppins", "normal");
            doc.text(subItem, 20, currentY);
            currentY += 6;
          });
        }

        // Add extra space between terms
        currentY += 1;
      });

      // Price Details
      currentY += 3;
      doc.setFontSize(12);
      doc.setFont("Poppins", "bold");
      doc.text("Price Details", 10, currentY);
      currentY += 5;

      doc.setFontSize(8);
      const priceDetails = [
        {
          label: "Agreed Price:",
          value: RentalListingData?.agreed_price || "N/A",
        },
        {
          label: "Encumbrances:",
          value: RentalListingData?.encumbrances || "N/A",
        },
        {
          label: "Final Price:",
          value: `${RentalListingData?.final_price || "N/A"} - including GST`,
        },
      ];

      priceDetails.forEach((detail) => {
        doc.setFont("Poppins", "normal");
        doc.text(detail.label, 10, currentY);
        doc.setFont("Poppins", "bold");
        doc.text(detail.value, 50, currentY);
        currentY += 6;
      });

      // Signatures
      currentY += 10;
      doc.setFont("poppins", "bold");
      doc.setFontSize(11);
      doc.text("Purchaser Signature:", 10, currentY - 6);
      doc.text("Vendor Signature:", pageWidth / 8.5 + 40, currentY - 6);
      doc.setFont("poppins", "normal");
      doc.setFontSize(9);

      const addSignatures = async (doc, currentY) => {
        const adminSignatureX = 10;
        const signatureWidth = 30;
        const signatureHeight = 10;
        const signatureGap = 5;
        const textGap = 6;
        const pageHeight = doc.internal.pageSize.getHeight();
        const borderWidth = 0.1;
        const padding = 2;
        const borderRadius = 2;
        const borderColor = [200, 200, 200];

        // Get current date and time
        const currentDateTime = new Date();
        const purchaserSignedDate = RentalListingData.purchaser_sign_date;

        doc.addImage(
          RentalListingData.purchaser_sign,
          "PNG",
          adminSignatureX + padding,
          currentY + padding,
          signatureWidth,
          signatureHeight
        );

        doc.setLineWidth(borderWidth);
        doc.setDrawColor(...borderColor);
        doc.roundedRect(
          adminSignatureX,
          currentY,
          signatureWidth + 2 * padding,
          signatureHeight + 2 * padding,
          borderRadius,
          borderRadius
        );

        // Add text with current date and time for purchaser signature
        doc.text(
          purchaserSignedDate,
          adminSignatureX + 1,
          currentY + signatureHeight + 2 * padding + textGap
        );

        const validSignatures = Array.isArray(signatures) ? signatures : [];
        const validSignaturesData = Array.isArray(signaturesData)
          ? signaturesData
          : [];
        const combined = signaturesData
          ? [...validSignatures, ...validSignaturesData]
          : [...validSignatures];

        const sortcombined = combined.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        sortcombined.forEach((signature, index) => {
          if (currentY + signatureHeight + signatureGap > pageHeight) {
            doc.addPage();
            currentY = 10;
          }

          const ownerSignatureX =
            adminSignatureX +
            20 +
            signatureWidth +
            signatureGap +
            (index % 4) * (signatureWidth + signatureGap);
          const ownerSignatureY =
            currentY +
            Math.floor(index / 4) * (signatureHeight + signatureGap * 4);

          const adjustedWidth = signatureWidth + 2 * padding;
          const adjustedHeight = signatureHeight + 2 * padding;

          doc.addImage(
            signature.data,
            "PNG",
            ownerSignatureX + padding,
            ownerSignatureY + padding,
            signatureWidth,
            signatureHeight
          );

          doc.setLineWidth(borderWidth);
          doc.setDrawColor(...borderColor);
          doc.roundedRect(
            ownerSignatureX,
            ownerSignatureY,
            adjustedWidth,
            adjustedHeight,
            borderRadius,
            borderRadius
          );
          const signedDate =
            new Date(signature.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) +
            ", " +
            new Date(signature.date).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true, // 12-hour format with AM/PM
            });

          doc.text(
            signedDate,
            ownerSignatureX + 1,
            ownerSignatureY + adjustedHeight + textGap
          );
        });
        currentY +=
          Math.ceil(combined.length / 4) * (signatureHeight + signatureGap * 4);
        return currentY;
      };

      await addSignatures(doc, currentY);
      const pdfBlob = doc.output("blob");
      setPdfData(pdfBlob);
      const now = new Date();
      const formattedDate = now
        .toLocaleDateString("en-GB")
        .split("/")
        .reverse()
        .join("-");
      const formattedTime = now.toLocaleTimeString("en-GB").replace(/:/g, "-");

      if (download) {
        const filename = `${rec_name}-Purchase_Agreement-${formattedDate}_${formattedTime}.pdf`;
        setDownload(false);
        setLoading(false);
      } else {
        const filename = `${rec_name}-Purchase_Agreement-${formattedDate}_${formattedTime}.pdf`;
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const msg_id = sessionStorage.getItem("uid");
        const payload = {
          file: pdfBase64,
          message_id: id,
          rec_email: rec_email,
          file_name: filename,
          file_mime_type: "pdf",
          type: "file",
          action: "Ajm_Link",
          service: "S3",
          stepper: "ajm_rental",
          msg_id: msg_id,
          pdf_name: "Purchase_Agreement",
          signatures: signatures,
        };
        try {
          setLoading(true);
          const response = await axios.put(
            `${BASE_URL}/api/v2/s3/files/${cus_id}`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          enqueueSnackbar("File uploaded successfully", {
            variant: "success",
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
          });
          setLoading(false);
          setOpen(true);
        } catch (error) {
          setLoading(false);
          const data = error.response.data.message;
          enqueueSnackbar(`${data}`, {
            variant: "error",
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
          });
        }
      }
    },
  });

  const handleDownload = () => {
    if (!pdfData) {
      enqueueSnackbar("No PDF to download", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }
    const now = new Date();
    const formattedDate = now
      .toLocaleDateString("en-GB")
      .split("/")
      .reverse()
      .join("-");
    const formattedTime = now.toLocaleTimeString("en-GB").replace(/:/g, "-");
    const filename = `${rec_name}-Purchase_Agreement-${formattedDate}_${formattedTime}.pdf`;
    const url = URL.createObjectURL(pdfData);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    navigate(`/result/success/${Tempname}Result`);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${formattedDate}, ${formattedTime}`;
  };

  const responsiveStyles = {
    container: {
      width: "100%",
      overflowX: "hidden",
      padding: isMobile ? "10px" : "20px",
    },
    title: {
      fontSize: isMobile ? "20px" : isTablet ? "22px" : "25px",
      fontWeight: "800",
      textAlign: "center",
      fontFamily: "Poppins",
      marginBottom: isMobile ? "1rem" : "2rem",
    },
    sectionTitle: {
      fontSize: isMobile ? "16px" : "18px",
      fontWeight: "800",
      marginBottom: "10px",
      borderBottom: "1px solid #e0e0e0",
      paddingBottom: "5px",
    },
    tableCell: {
      fontSize: isMobile ? "12px" : "14px",
      padding: isMobile ? "4px 0" : "8px 0",
    },
    termsText: {
      fontSize: isMobile ? "12px" : "14px",
    },
    signature: {
      maxWidth: isMobile ? "140px" : "180px",
      height: "auto",
      border: "2px solid #ddd",
      borderRadius: "5px",
      padding: "10px",
    },
  };


  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/link_distributor`, {
        external_message_id: id,
        cus_id: cus_id,
        internal_message_id: uid,
      });
      if (response.status === 200) {
        setLoading(false);
        const data = response.data.message;
        enqueueSnackbar(`${data}`, {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        window.close();
      }
    } catch (error) {
      setLoading(false);
      const data = error.response.data.error;
      enqueueSnackbar(`${data}`, {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  }; 

  const InfoTable = ({ data, label }) => {
    // Split data into left and right columns for large screens
    const entries = Object.entries(data);
    const midPoint = Math.ceil(entries.length / 2);
    const leftColumn = entries.slice(0, midPoint);
    const rightColumn = entries.slice(midPoint);

    return (
      <Grid style={{ marginBottom: "20px" }}>
        <Typography variant="h6" sx={responsiveStyles.sectionTitle}>
          {label}
        </Typography>
        <Grid container spacing={2}>
          {/* For mobile and tablet, use full width */}
          {isTablet ? (
            <Grid item xs={12}>
              <table style={{ width: "100%" }}>
                <tbody>
                  {entries.map(([key, value]) => (
                    <tr key={key}>
                      <td
                        style={{
                          ...responsiveStyles.tableCell,
                          width: "100px",
                          fontWeight: "400",
                        }}
                      >
                        {key}:
                      </td>
                      <td
                        style={{
                          ...responsiveStyles.tableCell,
                          fontWeight: "600",
                        }}
                      >
                        {value || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Grid>
          ) : (
            // For desktop, split into two columns
            <>
              <Grid item xs={6}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    {leftColumn.map(([key, value]) => (
                      <tr key={key}>
                        <td
                          style={{
                            ...responsiveStyles.tableCell,
                            width: "100px",
                            fontWeight: "400",
                          }}
                        >
                          {key}:
                        </td>
                        <td
                          style={{
                            ...responsiveStyles.tableCell,
                            fontWeight: "600",
                          }}
                        >
                          {value || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Grid>
              <Grid item xs={6}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    {rightColumn.map(([key, value]) => (
                      <tr key={key}>
                        <td
                          style={{
                            ...responsiveStyles.tableCell,
                            width: "80px",
                            fontWeight: "400",
                          }}
                        >
                          {key}:
                        </td>
                        <td
                          style={{
                            ...responsiveStyles.tableCell,
                            fontWeight: "600",
                          }}
                        >
                          {value || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Grid>
            </>
          )}
        </Grid>
      </Grid>
    );
  };
  return (
    <Grid sx={responsiveStyles.container}>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h4" sx={responsiveStyles.title}>
              Purchase Agreement
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <InfoTable
              data={{
                Name: RentalListingData?.vendor_name,
                Address: RentalListingData?.vendor_address,
                Email: RentalListingData?.vendor_email,
              }}
              label="Vendor Details"
            />

            <InfoTable
              data={{
                Registration: RentalListingData?.vehicle_registration,
                VIN: RentalListingData?.vehicle_vin,
                Chassis: RentalListingData?.vehicle_chassis,
                Engine: RentalListingData?.vehicle_engine,
                Odometer: RentalListingData?.vehicle_odometer,
                Color: RentalListingData?.vehicle_colour,
                "Engine Size": RentalListingData?.vehicle_engine_size,
                Fuel: RentalListingData?.vehicle_fuel,
                "License Expiry": RentalListingData?.vehicle_license_expiry,
                "WOF/COF Expiry": RentalListingData?.vehicle_wof_cof_expiry,
              }}
              label={`Vehicle Details: ${
                RentalListingData?.vehicle_name || "N/A"
              }`}
            />

            <Grid item xs={12} sx={{ mt: 3 }}>
              <Typography variant="h6" sx={responsiveStyles.sectionTitle}>
                Purchase Terms and Conditions
              </Typography>
              <Box sx={{ fontSize: responsiveStyles.termsText.fontSize }}>
                <ol style={{ paddingLeft: "20px", fontSize: "14px" }}>
                  <li>
                    That you are the Vehicle's registered owner and have full
                    authority to sell the Vehicle at the purchase price set out
                    below.
                  </li>
                  <li>That the Vehicle description is correct.</li>
                  <li>
                    That unless noted below, the Vehicle is unencumbered and no
                    third party has an interest in it including, but not limited
                    to, a charge registered on the Personal Property Securities
                    Register.
                  </li>
                  <li>
                    Alternatively, if there is a charge registered against the
                    Vehicle then you:
                    <ol type="a">
                      <li>
                        confirm that the amount required to release the charge
                        is less than the Vehicle's purchase price set out below;
                      </li>
                      <li>
                        allow for that amount to then be deducted from the
                        purchase price; and
                      </li>
                      <li>
                        authorise us to pay the amount required to release the
                        charge to the Lender.
                      </li>
                    </ol>
                  </li>
                  <li>
                    That to the best of your knowledge the distance recorded on
                    the odometer is true and correct.
                  </li>
                  <li>
                    That the Vehicle has a current Registration and Warrant of
                    Fitness.
                  </li>
                  <li>
                    Alternatively, that should the Warrant of Fitness have
                    expired then you authorise us to carry out any reasonable
                    expenses required to obtain a Warrant of Fitness and for
                    those costs to be deducted from the purchase price. We
                    confirm that we will liaise with you in relation to any
                    Warrant of Fitness expenses prior to them being incurred.
                  </li>
                  <li>
                    That to the best of your knowledge the Vehicle:
                    <ol type="a">
                      <li>has not been damaged in an accident or otherwise;</li>
                      <li>
                        has not previously been used as a taxi or rental car;
                      </li>
                      <li>
                        has not previously been driven without your authority;
                      </li>
                      <li>
                        has not previously been reported stolen to the police;
                      </li>
                      <li>
                        has not been subjected to any flooding or water damage
                      </li>
                    </ol>
                  </li>
                </ol>
              </Box>
            </Grid>

            <InfoTable
              data={{
                "Agreed price": RentalListingData?.agreed_price,
                Encumbrances: RentalListingData?.encumbrances,
                "Final price": `${
                  RentalListingData?.final_price || "N/A"
                } - including GST`,
              }}
              label="Price Details"
            />

            <Grid container spacing={2} mt={4}>
              {/* Directors Signature Section */}
              <Grid item xs={12} sm={12} md={4}>
                <Grid>
                  <Typography sx={{ fontFamily: "Poppins" }}>
                    Purchaser Signature
                  </Typography>
                </Grid>
                <Grid mt={3}>
                  <img
                    src={RentalListingData.purchaser_sign}
                    alt="Manager Sign"
                    style={{
                      maxWidth: "180px",
                      height: "auto",
                      border: "2px solid #ddd",
                      borderRadius: "5px",
                      padding: "10px",
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    display="block"
                    mt={1} // Add margin above the text for spacing
                  >
                    {RentalListingData?.purchaser_sign_date}{" "}
                    {/* Display formatted date */}
                  </Typography>
                </Grid>
              </Grid>

              {/* Owners Signs Section */}
              <Grid item xs={12} sm={12} md={8}>
                <Typography sx={{ fontFamily: "Poppins" }}>
                  Vendor Signature
                </Typography>
                <Grid container spacing={2} mt={1}>
                  {signaturesData &&
                  Array.isArray(signaturesData) &&
                  signaturesData.length > 0 ? (
                    signaturesData
                      .slice()
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((signature, index) => (
                        <Grid
                          item
                          xs={12}
                          sm={4}
                          md={4}
                          key={signature.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                          }}
                        >
                          <img
                            src={signature.data}
                            alt={`Signature ${index + 1}`}
                            style={{
                              width: "180px", // Fixed width
                              height: "90px", // Fixed height
                              objectFit: "contain", // Ensure the image fits within the box without distortion
                              border: "2px solid #ddd",
                              borderRadius: "5px",
                              padding: "10px",
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            align="center"
                            display="block"
                            mt={1} // Add margin above the text for spacing
                          >
                            {formatDate(signature.date)}{" "}
                            {/* Display formatted date */}
                          </Typography>
                        </Grid>
                      ))
                  ) : (
                    <Typography variant="body2" color="textSecondary" mt={3}>
                      No signatures available
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Grid>

            {is_readable ? (
              <Grid
                item
                xs={12}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                >
                  Send To Recipient
                </Button>
              </Grid>
            ) : (
              <>
                <Grid item xs={12} sx={{ mt: 3, textAlign: "center" }}>
                  <IconButton onClick={handleAddSignature} color="primary">
                    <AddIcon />
                  </IconButton>
                  <Typography
                    onClick={handleAddSignature}
                    sx={{
                      fontSize: "12px",
                      color: "green",
                      cursor: "pointer",
                      fontFamily: "Poppins",
                      display: "inline",
                    }}
                  >
                    Add Signature
                  </Typography>
                </Grid>{" "}
                {signatures.map((signature) => (
                  <Paper key={signature.id} sx={{ my: 2, p: 2 }}>
                    <Grid container alignItems="center">
                      <Grid item xs={2} sm={1}>
                        <IconButton
                          onClick={() => handleRemoveSignature(signature.id)}
                        >
                          <RemoveCircleIcon color="error" />
                        </IconButton>
                      </Grid>
                      <Grid item xs={10} sm={11}>
                        <SignaturePad
                          onSignature={(dataURL) =>
                            handleSignature(dataURL, signature.id)
                          }
                          email={rec_email}
                          mobile={rec_mobile}
                          sf_id={id}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Grid item xs={12} sx={{ mt: 3, textAlign: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    sx={{ fontFamily: "Poppins" }}
                  >
                    Submit
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </form>

      <Modal
        open={open}
        onClose={() => {}}
        disableEscapeKeyDown
        BackdropProps={{
          onClick: (e) => e.stopPropagation(),
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "90%" : 400,
            bgcolor: "background.paper",
            borderRadius: "10px",
            border: "2px solid #ff0000",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" textAlign="center" gutterBottom>
            Download PDF
          </Typography>
          <Typography sx={{ mt: 2 }}>
            Your file was uploaded successfully. Would you like to download the
            PDF?
          </Typography>
          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
            >
              Download
            </Button>
          </Box>
        </Box>
      </Modal>

      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RotateSpinner size={60} thickness={20} color="red" />
        </Box>
      )}
    </Grid>
  );
};

export default AjmAgreement;
