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

import SignaturePad from "../../../Lib/SignaturePad";
import logo from "../FormAssets/ajm_logo.jpg";
import { useSnackbar } from "notistack";
import { BASE_URL } from "../../../config";
import { poppinsRegularBase64 } from "../../../Lib/Signature_Fonts/Base64/poppins";

const AjmAutosure = ({
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

  // Extract declaration HTML from nested structure
  const declarationHtml =
    RentalListingData?.Ajm_Autosure_Esign?.send_data?.data?.declarationHtml ||
    "";

  console.log("RentalListingData", RentalListingData);
  console.log("Declaration HTML", declarationHtml);

  const validateSignatures = (signatures) => {
    return signatures.every((sig) => sig.data && sig.data.length > 3500);
  };

  const handleAddSignature = () => {
    // Early validation of required data
    if (!RentalListingData?.no_of_signs) {
      enqueueSnackbar("Missing signature limit configuration", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      return;
    }

    // Calculate available slots
    const existingSignatures = Array.isArray(signatureData)
      ? signatureData.length
      : 0;
    const totalAllowedSigns = Number(RentalListingData.no_of_signs);
    const remainingSlots = Math.max(0, totalAllowedSigns - existingSignatures);

    // Validate if more signatures can be added
    if (signatures.length >= remainingSlots) {
      enqueueSnackbar(`Maximum ${totalAllowedSigns} signature(s) allowed`, {
        variant: "warning",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      return;
    }

    // Add new signature if slots are available
    setSignatures((prevSignatures) => [
      ...prevSignatures,
      { id: Date.now(), data: null },
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

  // Enhanced HTML to text conversion with better structure preservation
  const processHtmlContent = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Remove scripts and clean content
    const scripts = tempDiv.querySelectorAll("script");
    scripts.forEach((script) => script.remove());

    let processedContent = [];

    const processElement = (element, level = 0) => {
      if (!element) return;

      const tagName = element.tagName?.toLowerCase();
      const text = element.textContent?.trim();

      if (!text && !["ul", "ol", "li"].includes(tagName)) return;

      const indent = "  ".repeat(level);

      switch (tagName) {
        case "h1":
          processedContent.push({
            type: "heading",
            level: 1,
            text: text,
            fontSize: 16,
            fontWeight: "bold",
            spacing: { top: 12, bottom: 8 },
          });
          break;
        case "h2":
          processedContent.push({
            type: "heading",
            level: 2,
            text: text,
            fontSize: 14,
            fontWeight: "bold",
            spacing: { top: 10, bottom: 6 },
          });
          break;
        case "h3":
        case "h4":
          processedContent.push({
            type: "heading",
            level: 3,
            text: text,
            fontSize: 12,
            fontWeight: "bold",
            spacing: { top: 8, bottom: 5 },
          });
          break;
        case "p":
          if (text.length > 0) {
            processedContent.push({
              type: "paragraph",
              text: text,
              fontSize: 10,
              fontWeight: "normal",
              spacing: { top: 3, bottom: 5 },
            });
          }
          break;
        case "ul":
        case "ol":
          // Process list items
          Array.from(element.children).forEach((child) => {
            if (child.tagName?.toLowerCase() === "li") {
              const listItemText = child.textContent?.trim();
              if (listItemText) {
                processedContent.push({
                  type: "listItem",
                  text: listItemText,
                  fontSize: 10,
                  fontWeight: "normal",
                  spacing: { top: 2, bottom: 2 },
                  bullet: tagName === "ul" ? "•" : "○",
                });
              }
            }
          });
          break;
        default:
          if (text.length > 0 && !element.closest("ul, ol")) {
            processedContent.push({
              type: "text",
              text: text,
              fontSize: 10,
              fontWeight: "normal",
              spacing: { top: 2, bottom: 3 },
            });
          }
      }
    };

    // Process all elements
    const processChildren = (parent) => {
      Array.from(parent.children).forEach((element) => {
        if (["ul", "ol"].includes(element.tagName?.toLowerCase())) {
          processElement(element);
        } else if (
          element.children.length > 0 &&
          element.tagName?.toLowerCase() !== "li"
        ) {
          processChildren(element);
        } else {
          processElement(element);
        }
      });
    };

    processChildren(tempDiv);
    return processedContent;
  };

  // Enhanced PDF generation with better structure
  const generateOptimizedPDF = async () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add custom fonts
    doc.addFileToVFS("Poppins-Regular.ttf", poppinsRegularBase64);
    doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
    doc.setFont("Poppins");

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;

    // Enhanced header function
    const addHeader = (doc, pageWidth) => {
      const headerHeight = 35;

      // Company Logo
      const logoWidth = 35;
      const logoHeight = 16;
      doc.addImage(logo, "PNG", margin, margin, logoWidth, logoHeight);

      // Header text
      doc.setFontSize(14);
      doc.setFont("Poppins", "bold");
      doc.text(
        "Insurance Declaration and Disclosure",
        pageWidth / 2,
        margin + 8,
        { align: "center" }
      );

      // Company details on right
      doc.setFontSize(9);
      doc.setFont("Poppins", "normal");
      const rightDetails = [
        "AutoSure Insurance Services",
        "07 348 8888",
        `Date: ${new Date().toLocaleDateString("en-GB")}`,
        "www.ajmotors.co.nz",
      ];

      let yPos = margin + 2;
      rightDetails.forEach((line) => {
        doc.text(line, pageWidth - margin, yPos, { align: "right" });
        yPos += 4;
      });

      // Separator line
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(
        margin,
        margin + headerHeight,
        pageWidth - margin,
        margin + headerHeight
      );

      return margin + headerHeight + 5;
    };

    // Check page break function
    const checkPageBreak = (requiredHeight) => {
      if (currentY + requiredHeight > pageHeight - margin - 15) {
        doc.addPage();
        currentY = addHeader(doc, pageWidth);
        return true;
      }
      return false;
    };

    // Add content function with better formatting
    const addContent = (contentItem) => {
      const { type, text, fontSize, fontWeight, spacing, bullet } = contentItem;

      if (!text || text.trim() === "") return;

      doc.setFontSize(fontSize);
      doc.setFont("Poppins", fontWeight);

      currentY += spacing.top;

      let displayText = text;
      let leftMargin = margin;

      if (type === "listItem") {
        displayText = `${bullet} ${text}`;
        leftMargin = margin + 5;
      }

      // Split text to fit within margins
      const splitText = doc.splitTextToSize(
        displayText,
        contentWidth - (leftMargin - margin)
      );
      const textHeight = splitText.length * (fontSize * 0.35) + spacing.bottom;

      checkPageBreak(textHeight);

      // Add the text
      doc.text(splitText, leftMargin, currentY);
      currentY += splitText.length * (fontSize * 0.35) + spacing.bottom;
    };

    // Initialize first page
    currentY = addHeader(doc, pageWidth);

    // Process and add HTML content
    const processedContent = processHtmlContent(declarationHtml);
    processedContent.forEach(addContent);

    // Add signatures section
    currentY += 15;
    checkPageBreak(80);

    // Signatures header
    doc.setFontSize(14);
    doc.setFont("Poppins", "bold");
    doc.text("Digital Signatures", margin, currentY);
    currentY += 10;

    // Combine all signatures
    const allSignatures = [
      ...(Array.isArray(signatures) ? signatures : []),
      ...(Array.isArray(signaturesData) ? signaturesData : []),
    ]
      .filter((sig) => sig.data)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allSignatures.length > 0) {
      const signatureWidth = 70;
      const signatureHeight = 25;
      const signaturesPerRow = Math.floor(contentWidth / (signatureWidth + 10));

      allSignatures.forEach((signature, index) => {
        const row = Math.floor(index / signaturesPerRow);
        const col = index % signaturesPerRow;

        const signatureX = margin + col * (signatureWidth + 10);
        const signatureY = currentY + row * (signatureHeight + 25);

        // Check if we need a new page
        if (signatureY + signatureHeight + 20 > pageHeight - margin) {
          doc.addPage();
          currentY = addHeader(doc, pageWidth);

          // Recalculate position for new page
          const newRow = 0;
          const newSignatureY = currentY + newRow * (signatureHeight + 25);

          // Add signature
          try {
            doc.addImage(
              signature.data,
              "PNG",
              signatureX,
              newSignatureY,
              signatureWidth,
              signatureHeight
            );

            // Add signature border
            doc.setLineWidth(0.5);
            doc.setDrawColor(150, 150, 150);
            doc.rect(
              signatureX,
              newSignatureY,
              signatureWidth,
              signatureHeight
            );

            // Add signature details
            doc.setFontSize(8);
            doc.setFont("Poppins", "normal");
            const signatureDate = new Date(signature.date).toLocaleDateString(
              "en-GB"
            );
            const signatureTime = new Date(signature.date).toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            doc.text(
              `Signed: ${signatureDate}`,
              signatureX,
              newSignatureY + signatureHeight + 5
            );
            doc.text(
              `Time: ${signatureTime}`,
              signatureX,
              newSignatureY + signatureHeight + 9
            );

            currentY = newSignatureY + signatureHeight + 15;
          } catch (error) {
            console.error("Error adding signature to PDF:", error);
          }
        } else {
          // Add signature to current page
          try {
            doc.addImage(
              signature.data,
              "PNG",
              signatureX,
              signatureY,
              signatureWidth,
              signatureHeight
            );

            // Add signature border
            doc.setLineWidth(0.5);
            doc.setDrawColor(150, 150, 150);
            doc.rect(signatureX, signatureY, signatureWidth, signatureHeight);

            // Add signature details
            doc.setFontSize(8);
            doc.setFont("Poppins", "normal");
            const signatureDate = new Date(signature.date).toLocaleDateString(
              "en-GB"
            );
            const signatureTime = new Date(signature.date).toLocaleTimeString(
              "en-GB",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            doc.text(
              `Signed: ${signatureDate}`,
              signatureX,
              signatureY + signatureHeight + 5
            );
            doc.text(
              `Time: ${signatureTime}`,
              signatureX,
              signatureY + signatureHeight + 9
            );
          } catch (error) {
            console.error("Error adding signature to PDF:", error);
          }
        }
      });

      // Update currentY for the last row
      const lastRowIndex = Math.floor(
        (allSignatures.length - 1) / signaturesPerRow
      );
      currentY += (lastRowIndex + 1) * (signatureHeight + 25);
    }

    return doc;
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

      try {
        const doc = await generateOptimizedPDF();
        const pdfBlob = doc.output("blob");
        setPdfData(pdfBlob);

        const now = new Date();
        const formattedDate = now
          .toLocaleDateString("en-GB")
          .split("/")
          .reverse()
          .join("-");
        const formattedTime = now
          .toLocaleTimeString("en-GB")
          .replace(/:/g, "-");

        if (download) {
          const filename = `${rec_name}-Insurance_Declaration-${formattedDate}_${formattedTime}.pdf`;
          setDownload(false);
          setLoading(false);
        } else {
          const filename = `${rec_name}-Insurance_Declaration-${formattedDate}_${formattedTime}.pdf`;
          const pdfBase64 = doc.output("datauristring").split(",")[1];
          const msg_id = sessionStorage.getItem("uid");
          const payload = {
            file: pdfBase64,
            message_id: id,
            rec_email: rec_email,
            file_name: filename,
            file_mime_type: "pdf",
            type: "file",
            action: "Ajm_Autosure_Esign",
            service: "S3",
            stepper: "ajm_rental",
            msg_id: msg_id,
            pdf_name: "Insurance_Declaration",
            signatures: signatures,
          };

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
        }
      } catch (error) {
        setLoading(false);
        const data = error.response?.data?.message || "An error occurred";
        enqueueSnackbar(`${data}`, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
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
    const filename = `${rec_name}-Insurance_Declaration-${formattedDate}_${formattedTime}.pdf`;
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
      color: "#1976d2",
    },
    sectionTitle: {
      fontSize: isMobile ? "16px" : "18px",
      fontWeight: "700",
      marginBottom: "15px",
      borderBottom: "2px solid #1976d2",
      paddingBottom: "8px",
      color: "#333",
    },
    declarationContent: {
      fontSize: isMobile ? "13px" : "14px",
      lineHeight: "1.7",
      marginBottom: "25px",
      padding: "20px",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      border: "1px solid #e9ecef",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      "& h1, & h2, & h3, & h4": {
        color: "#1976d2",
        marginTop: "20px",
        marginBottom: "10px",
        fontWeight: "600",
      },
      "& h2": {
        fontSize: isMobile ? "16px" : "18px",
        borderBottom: "1px solid #ddd",
        paddingBottom: "5px",
      },
      "& h4": {
        fontSize: isMobile ? "14px" : "15px",
        color: "#555",
      },
      "& p": {
        marginBottom: "12px",
        textAlign: "justify",
      },
      "& ul, & ol": {
        paddingLeft: "25px",
        marginBottom: "15px",
      },
      "& li": {
        marginBottom: "8px",
        lineHeight: "1.6",
      },
    },
    signatureGrid: {
      marginTop: "20px",
    },
    signatureCard: {
      padding: "15px",
      borderRadius: "8px",
      backgroundColor: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      border: "1px solid #e0e0e0",
      textAlign: "center",
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      },
    },
    signature: {
      maxWidth: "100%",
      width: isMobile ? "120px" : "160px",
      height: "auto",
      border: "2px solid #ddd",
      borderRadius: "6px",
      padding: "8px",
      backgroundColor: "#fff",
    },
    addSignatureButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      margin: "20px auto",
      padding: "10px 20px",
      backgroundColor: "#e8f5e8",
      border: "2px dashed #4caf50",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.3s",
      "&:hover": {
        backgroundColor: "#d4edda",
        borderColor: "#28a745",
      },
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

  return (
    <Grid sx={responsiveStyles.container}>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h4" sx={responsiveStyles.title}>
              Insurance Declaration and Disclosure
            </Typography>
          </Grid>

          {/* Enhanced Declaration HTML Content */}
          {declarationHtml && (
            <Grid item xs={12}>
              <Typography variant="h6" sx={responsiveStyles.sectionTitle}>
                📋 Important Information - Please Read Carefully
              </Typography>
              <Box
                sx={responsiveStyles.declarationContent}
                dangerouslySetInnerHTML={{ __html: declarationHtml }}
              />
            </Grid>
          )}

          {/* Enhanced Existing signatures display */}
          {signaturesData &&
            Array.isArray(signaturesData) &&
            signaturesData.length > 0 && (
              <Grid item xs={12} sx={responsiveStyles.signatureGrid}>
                <Typography variant="h6" sx={responsiveStyles.sectionTitle}>
                  ✍️ Existing Signatures
                </Typography>
                <Grid container spacing={2}>
                  {signaturesData
                    .slice()
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((signature, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        key={signature.id || index}
                      >
                        <Box sx={responsiveStyles.signatureCard}>
                          <img
                            src={signature.data}
                            alt={`Signature ${index + 1}`}
                            style={responsiveStyles.signature}
                          />
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            display="block"
                            mt={2}
                            sx={{
                              fontWeight: "500",
                              fontSize: "0.75rem",
                              backgroundColor: "#f5f5f5",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              marginTop: "10px",
                            }}
                          >
                            {formatDate(signature.date)}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                </Grid>
              </Grid>
            )}

          {is_readable ? (
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "30px",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                size="large"
                sx={{
                  padding: "12px 30px",
                  fontSize: "16px",
                  fontWeight: "600",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                }}
              >
                📧 Send To Recipient
              </Button>
            </Grid>
          ) : (
            <>
              {/* Enhanced Add Signature Button */}
              <Grid item xs={12}>
                <Box
                  sx={responsiveStyles.addSignatureButton}
                  onClick={handleAddSignature}
                >
                  <AddIcon color="success" />
                  <Typography
                    sx={{
                      fontSize: "14px",
                      color: "#28a745",
                      fontWeight: "600",
                      fontFamily: "Poppins",
                    }}
                  >
                    Add New Signature
                  </Typography>
                </Box>
              </Grid>

              {/* Enhanced signature input areas */}
              {signatures.map((signature) => (
                <Grid item xs={12} key={signature.id}>
                  <Paper
                    sx={{
                      my: 2,
                      p: 3,
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      border: "1px solid #e3f2fd",
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={2} sm={1}>
                        <IconButton
                          onClick={() => handleRemoveSignature(signature.id)}
                          sx={{
                            backgroundColor: "#ffebee",
                            "&:hover": {
                              backgroundColor: "#ffcdd2",
                            },
                          }}
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
                </Grid>
              ))}

              {/* Enhanced Submit Button */}
              <Grid item xs={12} sx={{ mt: 4, textAlign: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="large"
                  disabled={!isSubmitEnabled}
                  sx={{
                    fontFamily: "Poppins",
                    padding: "15px 40px",
                    fontSize: "16px",
                    fontWeight: "600",
                    borderRadius: "10px",
                    boxShadow: "0 6px 15px rgba(25, 118, 210, 0.3)",
                    textTransform: "none",
                    background: isSubmitEnabled
                      ? "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)"
                      : "rgba(0, 0, 0, 0.12)",
                    "&:hover": {
                      boxShadow: isSubmitEnabled
                        ? "0 8px 20px rgba(25, 118, 210, 0.4)"
                        : "none",
                      transform: isSubmitEnabled ? "translateY(-2px)" : "none",
                    },
                    "&:disabled": {
                      color: "rgba(0, 0, 0, 0.26)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  📄 Submit Declaration
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </form>

      {/* Enhanced Modal */}
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
            width: isMobile ? "90%" : 450,
            bgcolor: "background.paper",
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            p: 4,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#e8f5e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Typography sx={{ fontSize: "24px" }}>✅</Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: "600",
              color: "#333",
              marginBottom: "10px",
              fontFamily: "Poppins",
            }}
          >
            Success!
          </Typography>

          <Typography
            sx={{
              color: "#666",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "25px",
            }}
          >
            Your declaration has been submitted successfully. Would you like to
            download the PDF document for your records?
          </Typography>

          <Box sx={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                navigate(`/result/success/${Tempname}Result`);
              }}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "500",
                padding: "10px 20px",
              }}
            >
              Skip Download
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: "600",
                padding: "10px 20px",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
              }}
            >
              📥 Download PDF
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Enhanced Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RotateSpinner size={60} thickness={20} color="#1976d2" />
          <Typography
            sx={{
              marginTop: "20px",
              fontSize: "16px",
              fontWeight: "500",
              color: "#333",
              fontFamily: "Poppins",
            }}
          >
            Processing your declaration...
          </Typography>
        </Box>
      )}
    </Grid>
  );
};

export default AjmAutosure;
