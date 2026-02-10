import React, { useRef, useState } from "react";
import {
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  Box,
  Modal,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Link,
  TableRow,
  Paper,
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
import logo from "./FormAssets/sbho_logo.png";
import { useSnackbar } from "notistack";
import { BASE_URL } from "../../config";
import { poppinsRegularBase64 } from "../../Lib/Signature_Fonts/Base64/poppins";

const GeneralListing = ({
  General_Lisiting,
  id,
  rec_email,
  rec_mobile,
  cus_id,
  rec_name,
  signatureData,
}) => {
  const [GeneralLisitingData, setGeneralLisitingData] =
    useState(General_Lisiting);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const Tempname = sessionStorage.getItem("TempName");
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { uid } = useParams();
  const [signatures, setSignatures] = useState([]);
  const [download, setDownload] = useState(false);
  const [open, setOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [signaturesData, setSignaturesData] = useState(signatureData);
  const [rowData, setRowData] = useState({
    propert_owners_names: GeneralLisitingData.propert_owners_names || "-",
    owners_postal_address: GeneralLisitingData.owners_postal_address || "-",
    listed_property_address: GeneralLisitingData.listed_property_address || "-",
    phone: GeneralLisitingData.phone || "-",
    email: GeneralLisitingData.email || "-",
    asking_price: GeneralLisitingData.asking_price || "-",
  });

  const validateSignatures = (signatures) => {
    return signatures.every((sig) => sig.data && sig.data.length > 3500);
  };

  const handleAddSignature = () => {
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
      const doc = new jsPDF();
      doc.addFileToVFS("Poppins-Regular.ttf", poppinsRegularBase64);
      doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
      doc.setFont("Poppins");
      const headerHeight = 30;
      const footerHeight = 20;

      const header = function (data) {
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.width;
        const logoWidth = 84;
        const logoHeight = 20;
        doc.addImage(
          logo,
          "PNG",
          data.settings.margin.left,
          8,
          logoWidth,
          logoHeight
        );

        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.setFont("Poppins", "normal");

        const contactText = `WAADII PTY LTD\n1300 609 392\nSaleByHomeOwner.com.au\nGPO BOX 2002, BRISBANE QLD 4000\nadmin@salebyhomeowner.com.au`;
        const contactLines = contactText.split("\n");

        const startY = 10;
        contactLines.forEach((line, index) => {
          const textY = startY + index * 5;
          doc.text(line, pageWidth - logoWidth, textY);
          if (line.includes("admin@salebyhomeowner.com.au")) {
            doc.link(
              pageWidth - logoWidth - 10,
              textY - 3,
              doc.getTextWidth(line),
              5,
              { url: "mailto:admin@salebyhomeowner.com.au", target: "_blank" }
            );
          } else if (line.includes("SaleByHomeOwner.com.au")) {
            doc.link(
              pageWidth - logoWidth - 5,
              textY - 3,
              doc.getTextWidth(line),
              5,
              { url: "www.SaleByHomeOwner.com.au", target: "_blank" }
            );
          }
        });
      };

      let currentY = 40;
      doc.autoTable({
        didDrawPage: header,
      });

      const addContent = (text, options = {}) => {
        const {
          fontSize = 10.5,
          fontStyle = "normal",
          lineHeight = 5,
          type = "text",
          startY = currentY,
          startX = 10,
          image = null,
          imgWidth = 50,
          imgHeight = 50,
          align = "left",
        } = options;

        doc.setFont("Poppins", fontStyle);
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, 180);
        const pageWidth = doc.internal.pageSize.width;

        lines.forEach((line) => {
          if (currentY + lineHeight > 325 - headerHeight - footerHeight) {
            doc.addPage();
            currentY = 20 + headerHeight;
            doc.autoTable({
              didDrawPage: header,
            });
          }
          if (type === "text") {
            if (align === "center") {
              const textWidth = doc.getTextWidth(line);
              const textX = (pageWidth - textWidth) / 2;
              doc.text(line, textX, currentY);
            } else {
              doc.text(line, startX, currentY);
              currentY += lineHeight;
            }
          }
        });

        if (type === "image" && image) {
          if (currentY + imgHeight > 325 - headerHeight - footerHeight) {
            doc.addPage();
            currentY = 20 + headerHeight;
            doc.autoTable({
              didDrawPage: header,
            });
          }
          doc.addImage(image, "PNG", startX, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        }
      };

      const drawRoundedRect = (x, y, width, height, radius) => {
        doc.setDrawColor(255, 0, 0);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, width, height, radius, radius);
      };

      const addTableInRowContainer = (rows, options = {}) => {
        const {
          containerWidth = 180,
          containerRadius = 2,
          startX = 10,
          startY = currentY,
          margin = 5,
          rowGap = 20,
        } = options;

        const rowHeight = rows.length + 3;
        const tableHeight = rows.length * rowHeight + margin * 2;

        drawRoundedRect(
          startX,
          startY,
          containerWidth,
          tableHeight,
          containerRadius
        );

        const tableY = startY + margin;

        doc.autoTable({
          startY: tableY,
          margin: {
            top: tableY,
            left: startX + margin,
            right: startX + margin,
          },
          columns: [
            { header: "", dataKey: "col1" },
            { header: "", dataKey: "col2" },
          ],
          body: rows.map((row) => [
            {
              content: row.col1,
              styles: {
                font: "Poppins",
                fontSize: 10,
                fontStyle: "bold",
                valign: "middle",
                halign: "left",
              },
            },
            {
              content: row.col2,
              styles: {
                font: "Poppins",
                fontSize: 9,
                valign: "middle",
                halign: "left",
              },
            },
          ]),
          styles: {
            font: "Poppins",
            fontSize: 10,
            cellPadding: 2,
          },
          theme: "plain",
          rowHeight: rowHeight,
        });

        currentY = doc.autoTable.previous.finalY + 12;
      };

      const addContent2 = (text, options = {}) => {
        const {
          fontSize = 8,
          fontStyle = "normal",
          lineHeight = 6,
          startY = currentY,
          startX = 10,
          containerWidth = 180,
          containerHeight = 60,
          containerRadius = 2,
        } = options;

        doc.setFont("Poppins", fontStyle);
        doc.setFontSize(fontSize);
        drawRoundedRect(
          startX,
          startY,
          containerWidth,
          containerHeight,
          containerRadius
        );
        const lines = doc.splitTextToSize(text, containerWidth - 20);
        lines.forEach((line, index) => {
          doc.text(line, startX + 10, startY + 10 + index * lineHeight);
        });

        currentY = startY + 10;
      };

      currentY += 5;
      addContent(`GENERAL LISTING AGREEMENT Non-Exclusive(Open Listing)`, {
        fontSize: 13,
        fontStyle: "bold",
        align: "center",
      });
      currentY += 10;
      addContent(
        `An agreement between the Property owner & the Agent (“the Agreement”) authorizing the agent to offer the property ‘For Sale’ or ‘For Lease’ on the following Terms & Conditions`,
        {
          fontSize: 8,
          fontStyle: "bold",
        }
      );
      currentY += -3;
      addTableInRowContainer(
        [
          {
            col1: "PROPERTY OWNER NAMES",
            col2: rowData.propert_owners_names || "-",
          },
          {
            col1: "OWNERS POSTAL ADDRESS",
            col2: rowData.owners_postal_address || "-",
          },
          {
            col1: "‘LISTED’ PROPERTY ADDRESS",
            col2: rowData.listed_property_address || "-",
          },
          {
            col1: "PHONE",
            col2: rowData.phone || "-",
          },
          {
            col1: "EMAIL",
            col2: rowData.email || "-",
          },
          {
            col1: "ASKING PRICE",
            col2: rowData.asking_price || "-",
          },
        ],
        {
          containerWidth: 190,
          containerHeight: 60,
          containerRadius: 2,
          startX: 10,
          startY: currentY,
          rowGap: 20,
        }
      );

      currentY += 4;
      addContent(`Definitions`, {
        fontSize: 12,
        fontStyle: "bold",
      });

      const text1 = `1. “Introduced” means an effective cause of the relevant sale.
      2. “Marketing Expenses” means all costs, charges and expenses in marketing advertising and promoting the property for sale or lease in any way.
      3.“GST” means the Goods and Service Tax pursuant to A New Tax System ( Goods and Service Tax) Act 1999.
      4.“Sold” and “Sale” includes exchange or the disposition of the property in any manner whatsoever or any part of the legal or beneficial ownership of the property or a transaction.
      5. “settlement” and “transaction” each have the same meaning as each is defined in the Real Estate and Business Agents Act..`;
      const cleanedText1 = text1.replace(/\)/g, " ");

      currentY += 4;
      addContent2(cleanedText1, {
        fontSize: 7,
        fontStyle: "normal",
        lineHeight: 6,
        startY: currentY - 5,
        containerWidth: 190,
        containerHeight: 53,
        containerRadius: 2,
      });

      currentY += 50;
      addContent(`Terms & Conditions`, {
        fontSize: 12,
        fontStyle: "bold",
      });

      const text = `1. You have agreed to all the ‘Terms & conditions’ and ‘Privacy policy’ on www.SaleByHomeOwner.com.au when signing up via their website (www.SaleByHomeOwner.com.au) - Those Terms & conditions form part of this authority & should be read together.
      2.  All Marketing costs in relation to this authority have been paid up front prior to listing, and there are ‘NO additional commission or costs involved’ in relation to this authority (No commission paid on sale).
      3. You hereby authorize & instruct SaleByHomeOwner.com.au to publish & list your property (& relatedinformation) on all websites as per the ‘terms & conditions”.
      4.  You agree to inform SaleByHomeOwner.com.au immediately once the Property is Under Contract or Sold. To change the Status of your Ad, login to your account & change your status from ‘Available’ to ‘Sold’.
      5.  The person/s signing this document declare they are the registered owners of the property, or have in writingthe necessary right & approvals to market & sell their Property.
      6.   You agree to provide the relevant proof of ownership documents to SaleByHomeOwner.com.au`;
      const cleanedText = text.replace(/\)/g, " ");

      currentY += 4;
      addContent2(cleanedText, {
        fontSize: 8,
        fontStyle: "normal",
        lineHeight: 6,
        startY: currentY - 3,
        containerWidth: 190,
        containerHeight: 82,
        containerRadius: 2,
      });

      doc.addPage();
      doc.autoTable({
        didDrawPage: header,
      });
      currentY += -175;
      addContent(` OPEN LISTING`, {
        fontSize: 12,
        fontStyle: "bold",
      });

      const text2 = `1.You appoint the agent to sell the property but you retain a right to appoint other agents on similar terms without penalty.
      2. No end date required.
      3. Appointment can be ended by either you or the agent at any Time.
      4.  There is no commission to be paid on Sale/Settlement of your Home.`;
      const cleanedText2 = text2.replace(/\)/g, " ");

      currentY += 4;
      addContent2(cleanedText2, {
        fontSize: 8,
        fontStyle: "normal",
        lineHeight: 6,
        startY: currentY - 4,
        containerWidth: 190,
        containerHeight: 40,
        containerRadius: 2,
      });
      currentY += 50;
      doc.setFont("poppins", "bold");
      doc.setFontSize(11);
      const pageWidth = doc.internal.pageSize.width;
      doc.text("Directors Signature:", 10, currentY - 6);
      doc.text("Owners Signatures:", pageWidth / 8.5 + 40, currentY - 6);
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

        doc.addImage(
          logo,
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
          const signedDate = new Date(signature.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }) + ', ' + new Date(signature.date).toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // 12-hour format with AM/PM
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
        const filename = `${rec_name}-General_listing-${formattedDate}_${formattedTime}.pdf`;
        setDownload(false);
        setLoading(false);
      } else {
        const filename = `${rec_name}-General_listing-${formattedDate}_${formattedTime}.pdf`;
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const msg_id = sessionStorage.getItem("uid");
        const payload = {
          file: pdfBase64,
          message_id: id,
          rec_email: rec_email,
          file_name: filename,
          file_mime_type: "pdf",
          type: "file",
          action: "Sbho_Link",
          service: "Dropbox",
          stepper: "sbho_rental",
          msg_id: msg_id,
          pdf_name: "General_listing",
          signatures: signatures,
        };

        try {
          setLoading(true);
          const response = await axios.put(
            `${BASE_URL}/s3/files/${cus_id}`,
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
    const filename = `${rec_name}-General_listing-${formattedDate}_${formattedTime}.pdf`;
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

  const dataMapping = [
    { col1: "PROPERTY OWNER NAMES", col2: rowData.propert_owners_names },
    { col1: "OWNERS POSTAL ADDRESS", col2: rowData.owners_postal_address },
    {
      col1: "‘LISTED’ PROPERTY ADDRESS",
      col2: rowData.listed_property_address,
    },
    { col1: "PHONE", col2: rowData.phone },
    { col1: "EMAIL", col2: rowData.email },
    { col1: "ASKING PRICE", col2: rowData.asking_price },
  ];

  const handleInputChange = (e, key) => {
    setRowData({
      ...rowData,
      [key]: e.target.value,
    });
  };


  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString('en-GB');
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
    return `${formattedDate}, ${formattedTime}`;
  };


  return (
    <div style={{ width: "100%", overflowX: "hidden", padding: "20px" }}>
      <form onSubmit={formik.handleSubmit}>
        <Grid>
          <>
            <Grid mt={2}>
              <Typography
                style={{
                  fontSize: "25px",
                  fontWeight: "800",
                  textAlign: "center",
                  fontFamily: "Poppins",
                }}
              >
                GENERAL LISTING AGREEMENT Non-Exclusive<i>(Open Listing)</i>
              </Typography>
            </Grid>
            <Grid mt={3}>
              <Typography
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontWeight: "600",
                  fontFamily: "Poppins",
                }}
              >
                An agreement between the Property owner & the Agent (“the
                Agreement”) authorizing the agent to offer the property ‘For
                Sale’ or ‘For Lease’ on the following Terms & Conditions
              </Typography>
            </Grid>

            <Grid style={{ border: "2px solid black" }} p={2} mt={1}>
              <Typography
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontWeight: "600",
                  fontFamily: "Poppins",
                }}
              >
                * Please fill out the Listing form below, sign, & return to the
                Email above*
              </Typography>

              <Grid mt={2}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableBody>
                      {dataMapping.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell
                            sx={{
                              border: "1px solid #ccc",
                              fontWeight: "bold",
                              fontFamily: "Poppins",
                            }}
                          >
                            {row.col1}
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #ccc",
                              fontFamily: "Poppins",
                            }}
                          >
                            <TextField
                              fullWidth
                              variant="outlined"
                              value={row.col2}
                              onChange={(e) =>
                                handleInputChange(
                                  e,
                                  Object.keys(rowData)[index]
                                )
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>

            <Grid style={{ border: "2px solid black" }} p={2} mt={1}>
              <Typography
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  fontFamily: "Poppins",
                }}
              >
                Definitions
              </Typography>

              <Grid mt={1}>
                <Typography
                  variant="body1"
                  component="p"
                  sx={{ fontFamily: "Poppins" }}
                >
                  <strong>“Introduced”</strong>means an effective cause of the
                  relevant sale
                </Typography>
                <Typography
                  variant="body1"
                  component="p"
                  sx={{ fontFamily: "Poppins" }}
                >
                  <strong>“Marketing Expenses”</strong> means all costs, charges
                  and expenses in marketing advertising and promoting the
                  property for sale or lease in any way
                </Typography>
                <Typography
                  variant="body1"
                  component="p"
                  sx={{ fontFamily: "Poppins" }}
                >
                  <strong>“GST”</strong>means the Goods and Service Tax pursuant
                  to A New Tax System ( Goods and Service Tax) Act 1999
                </Typography>
                <Typography
                  variant="body1"
                  component="p"
                  sx={{ fontFamily: "Poppins" }}
                >
                  <strong>“Sold”</strong>and<strong>“Sale”</strong>includes
                  exchange or the disposition of the property in any manner
                  whatsoever or any part of the legal or beneficial ownership of
                  the property or a transaction
                </Typography>
                <Typography
                  variant="body1"
                  component="p"
                  sx={{ fontFamily: "Poppins" }}
                >
                  <strong>“settlement”</strong>and
                  <strong>“transaction” </strong>each have the same meaning as
                  each is defined in the Real Estate and Business Agents Act.
                </Typography>
              </Grid>
            </Grid>
            <Grid mt={2}>
              <Typography
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontWeight: "600",
                  fontSize: "25px",
                  fontFamily: "Poppins",
                }}
              >
                Terms & Conditions
              </Typography>
            </Grid>

            <Grid style={{ border: "2px solid black" }} p={2} mt={1}>
              <Typography
                variant="body1"
                component="p"
                sx={{ fontFamily: "Poppins" }}
              >
                <strong>1.</strong> You have agreed to all the{" "}
                <Link
                  href="https://www.salebyhomeowner.com.au/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ‘Terms & conditions’
                </Link>{" "}
                and{" "}
                <Link
                  href="https://www.salebyhomeowner.com.au/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ‘Privacy policy’
                </Link>{" "}
                on{" "}
                <Link
                  href="https://www.SaleByHomeOwner.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.SaleByHomeOwner.com.au
                </Link>{" "}
                when signing up via their website (
                <Link
                  href="https://www.SaleByHomeOwner.com.au"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.SaleByHomeOwner.com.au
                </Link>
                ) - Those Terms & conditions form part of this authority &
                should be read together.
              </Typography>
              <Typography
                variant="body1"
                component="p"
                mt={2}
                sx={{ fontFamily: "Poppins" }}
              >
                <strong>2.</strong> All Marketing costs in relation to this
                authority have been paid up front prior to listing, and there
                are ‘NO additional commission or costs involved’ in relation to
                this authority (No commission paid on sale)
              </Typography>
              <Typography
                variant="body1"
                component="p"
                mt={2}
                sx={{ fontFamily: "Poppins" }}
              >
                <strong>3.</strong> You hereby authorize & instruct
                SaleByHomeOwner.com.au to publish & list your property (&
                relatedinformation) on all websites as per the ‘terms &
                conditions”
              </Typography>
              <Typography
                variant="body1"
                component="p"
                mt={2}
                sx={{ fontFamily: "Poppins" }}
              >
                <strong>4.</strong> You agree to inform SaleByHomeOwner.com.au
                immediately once the Property is Under Contract or Sold. To
                change the Status of your Ad, login to your account & change
                your status from ‘Available’ to ‘Sold’
              </Typography>
              <Typography
                variant="body1"
                component="p"
                mt={2}
                sx={{ fontFamily: "Poppins" }}
              >
                <strong>5.</strong> The person/s signing this document declare
                they are the registered owners of the property, or have in
                writingthe necessary right & approvals to market & sell their
                Property.
              </Typography>
              <Typography
                variant="body1"
                component="p"
                mt={2}
                sx={{ fontFamily: "Poppins" }}
              >
                <strong>6.</strong> You agree to provide the relevant proof of
                ownership documents to SaleByHomeOwner.com.au
              </Typography>
            </Grid>

            <Grid style={{ border: "2px solid black" }} p={2} mt={1}>
              <Typography
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  fontFamily: "Poppins",
                }}
              >
                OPEN LISTING :
              </Typography>
              <Grid sx={{ fontFamily: "Poppins",paddingLeft:"15px" }} mt={1} component="ul">
                <li>
                  You appoint the agent to sell the property but you retain a
                  right to appoint other agents on similar terms without penalty
                </li>
                <li>No end date required</li>
                <li>
                  Appointment can be ended by either you or the agent at any
                  time{" "}
                </li>
                <li>
                  There is no commission to be paid on Sale/Settlement of your Home{" "}
                </li>
              </Grid>
            </Grid>

            <Grid container spacing={2} mt={4}>
              {/* Directors Signature Section */}
              <Grid item xs={12} sm={12} md={4}>
                <Grid>
                  <Typography sx={{ fontFamily: "Poppins" }}>
                    Directors Signature
                  </Typography>
                </Grid>
                <Grid mt={3}>
                  <img
                    src={logo}
                    alt="Manager Sign"
                    style={{
                      maxWidth: "180px",
                      height: "auto",
                      border: "2px solid #ddd",
                      borderRadius: "5px",
                      padding: "10px",
                    }}
                  />
                </Grid>
              </Grid>

              {/* Owners Signs Section */}
              <Grid item xs={12} sm={12} md={8}>
                <Typography sx={{ fontFamily: "Poppins" }}>
                  Owners Signs
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
            <Grid item xs={12} mt={3}>
              <Grid
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Grid>
                  <IconButton onClick={handleAddSignature} color="primary">
                    <AddIcon />
                  </IconButton>
                </Grid>
                <Grid
                  onClick={handleAddSignature}
                  style={{
                    fontSize: "12px !important",
                    color: "green",
                    cursor: "pointer",
                    fontFamily: "Poppins",
                  }}
                >
                  Add Signature
                </Grid>
              </Grid>
            </Grid>
            {signatures.map((signature) => (
              <Paper
                key={signature.id}
                style={{ margin: "10px 0", padding: "10px" }}
              >
                <Grid container>
                  <Grid item xs={1}>
                    <IconButton
                      onClick={() => handleRemoveSignature(signature.id)}
                    >
                      <RemoveCircleIcon color="error" />
                    </IconButton>
                  </Grid>
                  <Grid item xs={11}>
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
            <Grid
              item
              xs={12}
              mt={3}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={() => setDownload(true)}
                disabled={!isSubmitEnabled}
              >
                Download
              </Button> */}
              <Button
                variant="contained"
                color="primary"
                type="submit"
                // disabled={!isSubmitEnabled}
                sx={{ fontFamily: "Poppins", marginLeft: "10px" }}
              >
                Submit
              </Button>
            </Grid>
          </>
        </Grid>
      </form>
      <Modal
        open={open}
        onClose={() => {}}
        disableEscapeKeyDown
        BackdropProps={{
          onClick: (e) => e.stopPropagation(),
        }}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: "10px",
            border: "2px solid #ff0000",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Grid>
            <Typography
              id="modal-title"
              variant="h6"
              component="h2"
              textAlign={"center"}
            >
              Download PDF
            </Typography>
          </Grid>
          <Typography id="modal-description" sx={{ mt: 2 }}>
            Your file was uploaded successfully. Would you like to download the
            PDF?
          </Typography>
          <Grid sx={{ textAlign: "center" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              sx={{ mt: 2, textAlign: "center" }}
            >
              Download
            </Button>
          </Grid>
        </Box>
      </Modal>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.75)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
            }}
          >
            <RotateSpinner size={60} thickness={20} color="red" />{" "}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralListing;
