import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AppBar,
  Toolbar,
  Container,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  ThemeProvider,
  createTheme,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Divider,
  useMediaQuery,
  Link,
  Modal,
  useTheme,
  IconButton,
  Stack,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
import { styled } from "@mui/material/styles";

// Format currency function
const formatCurrency = (value) => {
  if (value === undefined || value === null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format numeric values
const formatValue = (value) => {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString();
};

// Styled components for package cards
const PackageCardHeader = styled(CardHeader)(({ theme, packagecolor }) => ({
  backgroundColor: packagecolor,
  color:
    packagecolor === "#f0c14b" || packagecolor === "#c0c0c0" ? "#000" : "#fff",
  textAlign: "center",
  padding: theme.spacing(1),
  "& .MuiCardHeader-title": {
    fontWeight: 600,
  },
}));

const PackageCardFooter = styled(Box)(({ theme, packagecolor }) => ({
  backgroundColor: packagecolor,
  color:
    packagecolor === "#f0c14b" || packagecolor === "#c0c0c0" ? "#000" : "#fff",
  textAlign: "center",
  padding: theme.spacing(1),
  fontWeight: 700,
  borderBottomLeftRadius: theme.shape.borderRadius,
  borderBottomRightRadius: theme.shape.borderRadius,
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  fontWeight: 600,
  textAlign: "center",
  backgroundColor: theme.palette.grey[100],
  padding: theme.spacing(0.5),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
}));

const FullscreenWrapper = styled(Box)({
  // height: '100vh',
  // width: '100vw',
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
  backgroundColor: "#f5f5f5",
});

const AjmInsurance = ({
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
  const [RentalListingData, setRentalListingData] = useState(
    Ajm_Data.Ajm_Insurance_Esign.send_data
  );
  const [selectedPackage, setSelectedPackage] = useState("");
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
  const [packages, setPackages] = useState([]);
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");

  // Extract insurance data from props
  useEffect(() => {
    if (Ajm_Data && Ajm_Data.Ajm_Insurance_Esign) {
      const data = Ajm_Data.Ajm_Insurance_Esign.send_data;

      // Set selected package
      setSelectedPackage(data.selectedPackage || "");

      // Set packages data
      if (data.protectionPackages && Array.isArray(data.protectionPackages)) {
        setPackages(data.protectionPackages);
      }
    }
  }, [Ajm_Data]);

  // Get all required data from props
  const getData = () => {
    if (
      !Ajm_Data ||
      !Ajm_Data.Ajm_Insurance_Esign ||
      !Ajm_Data.Ajm_Insurance_Esign.send_data
    ) {
      return {
        hubspotData: {},
        vehicleDetails: {},
        ppiDetails: {},
        mbiDetails: {},
        selectedGapOption: {},
      };
    }

    const { send_data } = Ajm_Data.Ajm_Insurance_Esign;
    return {
      hubspotData: send_data.hubspotData || {},
      vehicleDetails: send_data.vehicleDetails || {},
      ppiDetails: send_data.ppiDetails || {},
      mbiDetails: send_data.mbiDetails || {},
      loanCalculation: send_data.loanCalculation || {},
      financeTerms: send_data.financeTerms || {},
      selectedGapOption: send_data.selectedGapOption || {},
      selectedPackageDetails: send_data.selectedPackageDetails || {},
      protectionPackages: send_data.protectionPackages || {},
    };
  };

  const {
    hubspotData,
    ppiDetails,
    mbiDetails,
    selectedGapOption,
    selectedPackageDetails,
    protectionPackages,
  } = getData();

  // Handle package selection change
  const handlePackageChange = (packageName) => {
    setSelectedPackage(packageName);
  };

  // Get color for package
  const getPackageColor = (packageName) => {
    switch (packageName) {
      case "Diamond":
        return "#1a4d8c"; // dark blue
      case "Platinum":
        return "#7d7d7d"; // platinum/grey
      case "Gold":
        return "#f0c14b"; // gold
      case "Silver":
        return "#c0c0c0"; // silver
      case "Loan Only":
        return "#b71c1c"; // red
      default:
        return "#1a4d8c"; // default to blue
    }
  };

  // Add the dropdown component (place this where you want the dropdown to appear)
  const PaymentFrequencyDropdown = () => (
    <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mb: 2 }}>
      <InputLabel>Payment Frequency</InputLabel>
      <Select
        value={paymentFrequency}
        onChange={(e) => setPaymentFrequency(e.target.value)}
        label="Payment Frequency"
      >
        <MenuItem value="monthly">Monthly</MenuItem>
        <MenuItem value="fortnightly">Fortnightly</MenuItem>
        <MenuItem value="weekly">Weekly</MenuItem>
      </Select>
    </FormControl>
  );

  // Helper function to get the correct amount based on payment frequency
  const getAmountByFrequency = (packageData, frequency) => {
    switch (frequency) {
      case "monthly":
        return packageData.totalAmount;
      case "fortnightly":
        return packageData.totalFornighty;
      case "weekly":
        return packageData.totalWeekly;
      default:
        return packageData.totalAmount;
    }
  };

  // Helper function to get payment frequency label
  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case "monthly":
        return "Monthly";
      case "fortnightly":
        return "Fortnightly";
      case "weekly":
        return "Weekly";
      default:
        return "Monthly";
    }
  };

  const renderPackageCard = (packageData) => {
    const { name, ppi, gap, mbi } = packageData;
    const packageColor = getPackageColor(name);

    // Get the correct amount based on selected payment frequency
    const displayAmount = getAmountByFrequency(packageData, paymentFrequency);

    // Use the selectedGapOption if package has gap
    const gapMaxBenefit =
      gap && selectedGapOption ? selectedGapOption.maxBenefit : 0;
    const gapAdditionalBenefits =
      gap && selectedGapOption ? selectedGapOption.additionalBenefits : 0;

    return (
      <Card
        key={name}
        elevation={3}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border:
            selectedPackage === name ? `2px solid ${packageColor}` : "none",
        }}
      >
        <PackageCardHeader
          packagecolor={packageColor}
          title={`${name} Package`}
        />

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Box mb={2}>
            <SectionHeading variant="subtitle2">
              PAYMENT PROTECTION INSURANCE
            </SectionHeading>
            <Stack spacing={0.5} sx={{ fontSize: "0.875rem" }}>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Policy Type:</Typography>
                <Typography fontWeight="medium">
                  {ppi ? ppiDetails.ppiType : "No Cover"}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Cover Type:</Typography>
                <Typography fontWeight="medium">
                  {ppi ? ppiDetails.customerStatus : "No Cover"}
                </Typography>
              </Box>
              {ppi && (
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Term:</Typography>
                  <Typography fontWeight="medium">
                    {formatValue(ppiDetails.term)} months
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box mb={2}>
            <SectionHeading variant="subtitle2">
              GUARANTEED ASSET PROTECTION
            </SectionHeading>
            <Stack spacing={0.5} sx={{ fontSize: "0.875rem" }}>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Benefit up to:</Typography>
                <Typography fontWeight="medium">
                  {gap ? formatCurrency(gapMaxBenefit) : "No Cover"}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Additional:</Typography>
                <Typography fontWeight="medium">
                  {gap ? formatCurrency(gapAdditionalBenefits) : "No Cover"}
                </Typography>
              </Box>
              {gap && (
                <Box display="flex" justifyContent="space-between">
                  <Typography color="text.secondary">Term:</Typography>
                  <Typography fontWeight="medium">
                    {formatValue(ppiDetails.term)} months
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box>
            <SectionHeading variant="subtitle2">
              MECHANICAL BREAKDOWN INSURANCE
            </SectionHeading>
            <Stack spacing={0.5} sx={{ fontSize: "0.875rem" }}>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Coverage:</Typography>
                <Typography fontWeight="medium">
                  {mbi ? mbiDetails.mbiType : "No Cover"}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Mileage:</Typography>
                <Typography fontWeight="medium">
                  {mbi ? `${formatValue(mbiDetails.kms)} km` : "No Cover"}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography color="text.secondary">Term:</Typography>
                <Typography fontWeight="medium">
                  {mbi
                    ? `${formatValue(mbiDetails.termMonths)} months`
                    : "No Cover"}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </CardContent>

        <PackageCardFooter packagecolor={packageColor}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(displayAmount)}
            </Typography>
            <Typography variant="caption" color="white">
              {getFrequencyLabel(paymentFrequency)}
            </Typography>
          </Box>
        </PackageCardFooter>
      </Card>
    );
  };

  // Get the organization owner data from the email_sign_details
  const orgOwnerData =
    Ajm_Data && Ajm_Data.email_sign_details ? Ajm_Data.email_sign_details : {};

  // Find the details of the selected package
  const currentSelectedPackage =
    packages.find((pkg) => pkg.name === selectedPackage) ||
    selectedPackageDetails ||
    {};

  const validateSignatures = (signatures) => {
    return signatures.every((sig) => sig.data && sig.data.length > 3500);
  };

  const handleAddSignature = () => {
    // Early validation of required data
    if (!Ajm_Data?.no_of_signs) {
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
    const totalAllowedSigns = Number(Ajm_Data.no_of_signs);
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
      const pdfData = {
        hubspotData,
        ppiDetails,
        mbiDetails,
        selectedGapOption,
        packages,
        selectedPackage,
        orgOwnerData,
        signatures,
        signaturesData,
        rec_name,
      };

      // Generate PDF
      const doc = await generateInsurancePdf(pdfData);
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
        const selectedPkg =
          packages.find((pkg) => pkg.name === selectedPackage) ||
          currentSelectedPackage;
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
          action: "Ajm_Insurance_Esign",
          service: "S3",
          stepper: "ajm_rental",
          msg_id: msg_id,
          pdf_name: "Ajm_Insurance_Esign",
          signatures: signatures,
          selectedPackage: selectedPackage,
          paymentFrequency: paymentFrequency,
          q_monthly: selectedPkg?.totalAmount || 0,
          q_fortnightly: selectedPkg?.totalFornighty || 0,
          q_weekly: selectedPkg?.totalWeekly || 0,
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

  const generateInsurancePdf = async (data) => {
    const {
      hubspotData,
      vehicleDetails,
      ppiDetails,
      mbiDetails,
      selectedGapOption,
      packages,
      selectedPackage,
      orgOwnerData,
      signatures,
      signaturesData,
      rec_name,
    } = data;

    const currentSelectedPackage =
      packages.find((pkg) => pkg.name === selectedPackage) || {};

    // Create PDF document
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Setup fonts
    doc.addFileToVFS("Poppins-Regular.ttf", poppinsRegularBase64);
    doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
    doc.addFont("Poppins-Regular.ttf", "Poppins", "bold");
    doc.setFont("Poppins");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    // Utility Functions
    const formatCurrency = (value) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value || 0);

    const formatValue = (value) => (value || 0).toLocaleString();

    const getPackageColor = (packageName) => {
      const colors = {
        Diamond: [26, 77, 140],
        Platinum: [125, 125, 125],
        Gold: [240, 193, 75],
        Silver: [192, 192, 192],
        "Loan Only": [183, 28, 28],
      };
      return colors[packageName] || [26, 77, 140];
    };

    const setTextStyle = (size, weight = "normal", color = [0, 0, 0]) => {
      doc.setFontSize(size);
      doc.setFont("Poppins", weight);
      doc.setTextColor(...color);
    };

    const drawRect = (
      x,
      y,
      width,
      height,
      fill = false,
      color = [240, 240, 240]
    ) => {
      if (fill) {
        doc.setFillColor(...color);
        doc.rect(x, y, width, height, "F");
      } else {
        doc.setDrawColor(...color);
        doc.rect(x, y, width, height);
      }
    };

    const addLine = (y, color = [200, 200, 200]) => {
      doc.setDrawColor(...color);
      doc.line(margin, y, pageWidth - margin, y);
    };

    const checkPageBreak = (currentY, requiredSpace = 50) => {
      if (currentY > pageHeight - requiredSpace) {
        doc.addPage();
        return margin;
      }
      return currentY;
    };

    // Header Section
    const addHeader = () => {
      let y = 10;

      // Logo and title
      doc.addImage(logo, "PNG", margin, y, 40, 18);
      setTextStyle(16, "bold", [26, 77, 140]);
      doc.text("Insurance Protection Policy", pageWidth - margin, y + 10, {
        align: "right",
      });

      // Dealership info
      setTextStyle(10);
      const dealershipInfo = [
        orgOwnerData.org_owner_company_name ||
          hubspotData.dealership_name ||
          "Dealership Name",
        orgOwnerData.org_owner_company_address ||
          hubspotData.dealership_address ||
          "Dealership Address",
        `Manager: ${hubspotData.finance_manager || "Manager Name"}, phone: ${
          orgOwnerData.org_owner_phone ||
          hubspotData.dealership_phone ||
          "555 555 555"
        }`,
      ];
      doc.text(dealershipInfo, margin, y + 30);

      addLine(y + 40);
      return y + 45;
    };

    // Protection Header
    const addProtectionHeader = (startY) => {
      drawRect(margin, startY, contentWidth, 10, true, [26, 77, 140]);
      setTextStyle(12, "bold", [255, 255, 255]);
      doc.text("FINANCE PACKAGES", pageWidth / 2, startY + 6, {
        align: "center",
      });
      return startY + 10;
    };

    // Customer and Vehicle Info
    const addCustomerVehicleInfo = (startY) => {
      const y = startY + 5;
      setTextStyle(10);

      const addInfoLine = (label, value, x, yPos) => {
        setTextStyle(10, "bold");
        doc.text(`${label}:`, x, yPos);
        setTextStyle(10);
        doc.text(value, x + 20, yPos);
      };

      addInfoLine(
        "Name",
        hubspotData.securegateway_customer_name ||
          hubspotData.customer_name ||
          rec_name ||
          "Customer Name",
        margin,
        y
      );
      addInfoLine(
        "Vehicle",
        hubspotData.make_and_model || "Make and Model",
        pageWidth / 2,
        y
      );
      addInfoLine(
        "Phone",
        hubspotData.mobile_phone || "555 525 255",
        margin,
        y + 7
      );
      addInfoLine(
        "Registration",
        hubspotData.registration_no_ || "ABC123",
        pageWidth / 2,
        y + 7
      );

      addLine(y + 12);
      return y + 15;
    };

    // Simple Package Table - No highlighting
    const addPackageTable = (startY) => {
      const columnCount = packages.length;
      const columnWidth = contentWidth / columnCount;
      const baseRowHeight = 8;
      const sectionHeaderPadding = 4; // Padding after section headers
      const sectionBottomPadding = 6; // Padding after each section

      const sectionData = [
        {
          header: "PAYMENT PROTECTION INSURANCE",
          rows: [
            {
              key: "PPI Type",
              values: packages.map((pkg) =>
                pkg.ppi ? ppiDetails.ppiType : "No Cover"
              ),
            },
            {
              key: "PPI Status",
              values: packages.map((pkg) =>
                pkg.ppi ? ppiDetails.customerStatus : "-"
              ),
            },
            {
              key: "PPI Cover",
              values: packages.map((pkg) =>
                pkg.ppi
                  ? "Death, Accident, Illness, Disability, Hospitalization, Carer, Suspension, Redundancy, Employer Ceases Trading"
                  : "-"
              ),
            },
          ],
        },
        {
          header: "GUARANTEED ASSET PROTECTION",
          rows: [
            {
              key: "GAP Benefit",
              values: packages.map((pkg) =>
                pkg.gap
                  ? `Benefit up to ${formatCurrency(
                      selectedGapOption?.maxBenefit || 0
                    )}`
                  : "No Cover"
              ),
            },
            {
              key: "GAP Additional",
              values: packages.map((pkg) =>
                pkg.gap
                  ? `Additional Benefit: ${formatCurrency(
                      selectedGapOption?.additionalBenefits || 0
                    )}`
                  : "-"
              ),
            },
          ],
        },
        {
          header: "MECHANICAL BREAKDOWN INSURANCE",
          rows: [
            {
              key: "MBI Coverage",
              values: packages.map((pkg) =>
                pkg.mbi ? "Extensive Coverage" : "No Cover"
              ),
            },
            {
              key: "MBI Mileage",
              values: packages.map((pkg) =>
                pkg.mbi
                  ? `Mileage up to ${formatValue(mbiDetails?.kms || 150000)} km`
                  : "-"
              ),
            },
            {
              key: "MBI Term",
              values: packages.map((pkg) =>
                pkg.mbi
                  ? `Term: ${formatValue(mbiDetails?.termMonths || 24)} Months`
                  : "-"
              ),
            },
          ],
        },
      ];

      let currentY = startY;

      // Package headers - Simple, no highlighting
      packages.forEach((pkg, index) => {
        const x = margin + index * columnWidth;
        const packageColor = getPackageColor(pkg.name);

        // Normal header - no special highlighting for selected package
        doc.setFillColor(...packageColor);
        doc.rect(x, currentY, columnWidth, baseRowHeight, "F");

        // Header text
        const textColor =
          pkg.name === "Gold" || pkg.name === "Silver"
            ? [0, 0, 0]
            : [255, 255, 255];
        setTextStyle(9, "bold", textColor);
        doc.text(
          `${pkg.name} Package`,
          x + columnWidth / 2,
          currentY + baseRowHeight / 2 + 1,
          {
            align: "center",
            baseline: "middle",
          }
        );
      });

      currentY += baseRowHeight + sectionHeaderPadding; // Add padding after main headers

      // Process sections
      sectionData.forEach((section, sectionIndex) => {
        // Section header
        drawRect(
          margin,
          currentY,
          contentWidth,
          baseRowHeight,
          true,
          [245, 245, 245]
        );
        setTextStyle(8, "bold");
        doc.text(
          section.header,
          pageWidth / 2,
          currentY + baseRowHeight / 2 + 1,
          {
            align: "center",
            baseline: "middle",
          }
        );

        currentY += baseRowHeight + sectionHeaderPadding; // Add padding after section header

        // Section rows
        section.rows.forEach((row, rowIndex) => {
          const maxTextLength = Math.max(...row.values.map((v) => v.length));
          const rowHeight =
            baseRowHeight +
            (maxTextLength > 60
              ? baseRowHeight
              : maxTextLength > 30
              ? baseRowHeight * 0.5
              : 0);

          row.values.forEach((cell, colIndex) => {
            const x = margin + colIndex * columnWidth;

            // No background highlighting - just display the data
            const textLines = doc.splitTextToSize(cell, columnWidth - 4);
            setTextStyle(7);
            const textY = currentY + rowHeight / 2 - (textLines.length - 1) * 2;

            textLines.forEach((line, i) => {
              doc.text(line, x + columnWidth / 2, textY + i * 4, {
                align: "center",
                baseline: "middle",
              });
            });
          });

          currentY += rowHeight;

          // Add small padding between rows
          if (rowIndex < section.rows.length - 1) {
            currentY += 2;
          }
        });

        // Add padding after each section (except the last one)
        if (sectionIndex < sectionData.length - 1) {
          currentY += sectionBottomPadding;
        }
      });

      // Add padding before final price row
      currentY += sectionBottomPadding;

      // Final price row - No special highlighting
      packages.forEach((pkg, index) => {
        const x = margin + index * columnWidth;
        const packageColor = getPackageColor(pkg.name);

        doc.setFillColor(...packageColor);
        doc.rect(x, currentY, columnWidth, baseRowHeight, "F");

        const textColor =
          pkg.name === "Gold" || pkg.name === "Silver"
            ? [0, 0, 0]
            : [255, 255, 255];
        setTextStyle(10, "bold", textColor);
        doc.text(
          formatCurrency(pkg.totalAmount || 0),
          x + columnWidth / 2,
          currentY + baseRowHeight / 2 + 1,
          {
            align: "center",
            baseline: "middle",
          }
        );
      });

      currentY += baseRowHeight + 6; // Add padding after price row

      // Note
      setTextStyle(8, "italic", [100, 100, 100]);
      doc.text(
        "IMPORTANT NOTE: The price produced by the calculator is indicative only and does not represent a quote or an offer.",
        margin,
        currentY
      );
      doc.text("It should be used as a guide only.", margin, currentY + 4);

      return currentY + 10;
    };

    // Terms and Conditions
    const addTermsAndConditions = (startY) => {
      setTextStyle(8);
      const dealershipName =
        orgOwnerData.org_owner_company_name ||
        hubspotData.dealership_name ||
        "The dealership";
      const termsText = `${dealershipName} arranges this as an agent of Autosure. You should not rely on the information contained in these Finance Protection Options as personal advice. You are solely responsible for the actions that you may take in reliance on, or accessed through this document. You should consult a qualified adviser for advice on whether these options are suitable for your personal objectives, financial situation and needs.`;

      const termsLines = doc.splitTextToSize(termsText, contentWidth);
      doc.text(termsLines, margin, startY);

      const additionalText =
        "Before making your decision, please consider the relevant Policy Document available from your Business Manager.";
      doc.text(additionalText, margin, startY + termsLines.length * 4);

      return startY + termsLines.length * 4 + 8;
    };

    // Acknowledgment
    const addAcknowledgment = (startY) => {
      setTextStyle(9, "bold");
      doc.text("I/we acknowledge that:", margin, startY);

      const bulletPoints = [
        "I/we have been provided with, read and understood the Policy Document(s) for the insurance we are applying for.",
        "I/we will not be insured with any insurance unless I/we complete the insurer's application documentation and that I/we understand that eligibility for insurance is subject to the insurer's underwriting criteria.",
        "The payment amounts and payment frequencies are indicative only and may vary depending on the finance provider and my personal circumstances. The final amount payable will only be disclosed once my/our application for finance and insurance has been accepted.",
        "All the repayment options include the loan repayment, the premium for the level of cover purchased and interest on the total amount borrowed. Amount payable will only be disclosed once my/our application for finance and insurance has been accepted.",
        "The benefits of the insurance products listed above have been fully explained to me and I/we understand the protection that they provide.",
        "I/we understand that by electing to exclude any of these products, their associated benefits and protection will not apply and hereby waive and decline all such benefits.",
      ];

      let currentY = startY + 6;
      setTextStyle(8);

      bulletPoints.forEach((point) => {
        const bulletLines = doc.splitTextToSize(`• ${point}`, contentWidth - 5);
        doc.text(bulletLines, margin, currentY);
        currentY += bulletLines.length * 4;
      });

      return currentY + 5;
    };

    // Selected Package Details
    const addSelectedPackageDetails = (startY) => {
      if (!selectedPackage) return startY;

      let currentY = startY;
      const packageColor = getPackageColor(selectedPackage);

      // Simple header
      drawRect(margin, currentY, contentWidth, 10, true, packageColor);
      setTextStyle(10, "bold", [255, 255, 255]);
      doc.text(
        `Selected Package: ${selectedPackage}`,
        pageWidth / 2,
        currentY + 6,
        { align: "center" }
      );

      currentY += 15;
      const colWidth = contentWidth / 3;

      // Column data
      const columns = [
        {
          title: "Payment Protection Insurance",
          data: currentSelectedPackage.ppi
            ? [
                ["Status:", "Included"],
                ["Type:", ppiDetails.ppiType || "Employee"],
                ["Cover:", ppiDetails.customerStatus || "Joint"],
              ]
            : [["Status:", "Not Included"]],
        },
        {
          title: "Guaranteed Asset Protection",
          data: currentSelectedPackage.gap
            ? [
                ["Status:", "Included"],
                ["Max Benefit:", formatCurrency(selectedGapOption?.maxBenefit)],
                [
                  "Additional:",
                  formatCurrency(selectedGapOption?.additionalBenefits),
                ],
              ]
            : [["Status:", "Not Included"]],
        },
        {
          title: "Mechanical Breakdown Insurance",
          data: currentSelectedPackage.mbi
            ? [
                ["Status:", "Included"],
                ["Coverage:", mbiDetails.mbiType || "Extensive Coverage"],
                ["Mileage:", `${formatValue(mbiDetails.kms || 150000)} km`],
                ["Term:", `${formatValue(mbiDetails.termMonths || 24)} months`],
              ]
            : [["Status:", "Not Included"]],
        },
      ];

      // Column headers
      columns.forEach((col, idx) => {
        const x = margin + idx * colWidth;
        drawRect(x, currentY, colWidth - 5, 8, true);
        setTextStyle(9, "bold");
        doc.text(col.title, x + (colWidth - 5) / 2, currentY + 5, {
          align: "center",
          baseline: "middle",
        });
      });

      currentY += 12;

      // Column content
      const maxRows = Math.max(...columns.map((col) => col.data.length));
      for (let row = 0; row < maxRows; row++) {
        columns.forEach((col, idx) => {
          if (col.data[row]) {
            const x = margin + idx * colWidth;
            setTextStyle(8, "bold");
            doc.text(col.data[row][0], x, currentY + row * 6);
            setTextStyle(8);
            doc.text(col.data[row][1], x + 25, currentY + row * 6);
          }
        });
      }

      currentY += maxRows * 6 + 5;

      // Total
      setTextStyle(12, "bold", packageColor);
      doc.text(
        `Total: ${formatCurrency(currentSelectedPackage.totalAmount || 0)}`,
        pageWidth / 2,
        currentY,
        { align: "center" }
      );

      return currentY + 15;
    };

    // Compact Signature Section
    const addSignatures = (startY) => {
      let currentY = startY;

      setTextStyle(10, "bold");
      doc.text("Company Signature", margin, currentY);
      doc.text("Customer Signatures", margin + contentWidth / 2, currentY);

      currentY += 8;

      // Company signature - smaller size
      const companyWidth = 35;
      const companyHeight = 20;
      const companySignature = RentalListingData.user_signature || logo;
      doc.addImage(
        companySignature,
        "PNG",
        margin,
        currentY,
        companyWidth,
        companyHeight
      );
      drawRect(margin, currentY, companyWidth, companyHeight);

      setTextStyle(8);
      doc.text(
        new Date().toLocaleString(),
        margin,
        currentY + companyHeight + 5
      );
      doc.text("Company Representative", margin, currentY + companyHeight + 10);

      // Customer signatures - much smaller
      const signatures = [
        ...(data.signatures || []),
        ...(data.signaturesData || []),
      ];
      const sigWidth = 30; // Reduced from 40
      const sigHeight = 18; // Reduced from 25
      const sigGap = 8;
      const sigStartX = margin + contentWidth / 2;

      if (signatures.length > 0) {
        signatures.forEach((signature, index) => {
          const row = Math.floor(index / 2);
          const col = index % 2;
          const sigX = sigStartX + col * (sigWidth + sigGap);
          const sigY = currentY + row * (sigHeight + 12);

          // Check for page break
          if (sigY + sigHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin + 10;
            const newSigY = currentY;

            try {
              doc.addImage(
                signature.data,
                "PNG",
                sigX,
                newSigY,
                sigWidth,
                sigHeight,
                undefined,
                "FAST"
              );
            } catch (error) {
              drawRect(
                sigX,
                newSigY,
                sigWidth,
                sigHeight,
                true,
                [240, 240, 240]
              );
            }

            drawRect(sigX, newSigY, sigWidth, sigHeight);
            setTextStyle(7);
            doc.text(
              signature.name || `Signature ${index + 1}`,
              sigX,
              newSigY + sigHeight + 4
            );
            doc.text(
              new Date(signature.date).toLocaleString(),
              sigX,
              newSigY + sigHeight + 8
            );
          } else {
            try {
              doc.addImage(
                signature.data,
                "PNG",
                sigX,
                sigY,
                sigWidth,
                sigHeight,
                undefined,
                "FAST"
              );
            } catch (error) {
              drawRect(sigX, sigY, sigWidth, sigHeight, true, [240, 240, 240]);
            }

            drawRect(sigX, sigY, sigWidth, sigHeight);
            setTextStyle(7);
            doc.text(
              signature.name || `Signature ${index + 1}`,
              sigX,
              sigY + sigHeight + 4
            );
            doc.text(
              new Date(signature.date).toLocaleString(),
              sigX,
              sigY + sigHeight + 8
            );
          }
        });
      } else {
        // Placeholder signature
        drawRect(sigStartX, currentY, sigWidth, sigHeight);
        setTextStyle(7, "italic", [100, 100, 100]);
        doc.text(
          "Customer Signature",
          sigStartX + sigWidth / 2,
          currentY + sigHeight / 2,
          {
            align: "center",
            baseline: "middle",
          }
        );
        setTextStyle(7);
        doc.text("Customer", sigStartX, currentY + sigHeight + 4);
        doc.text("Date: ________________", sigStartX, currentY + sigHeight + 8);
      }

      return Math.max(
        currentY + companyHeight + 15,
        currentY + Math.ceil(signatures.length / 2) * (sigHeight + 12)
      );
    };

    // Generate PDF
    try {
      let yPos = addHeader();
      yPos = addProtectionHeader(yPos);
      yPos = addCustomerVehicleInfo(yPos);
      yPos = addPackageTable(yPos);

      yPos = checkPageBreak(yPos);
      yPos = addTermsAndConditions(yPos + 5);
      yPos = addAcknowledgment(yPos);

      yPos = checkPageBreak(yPos, 120);
      yPos = addSelectedPackageDetails(yPos);

      yPos = checkPageBreak(yPos, 80);
      addSignatures(yPos);

      return doc;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  };

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
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
        <form onSubmit={formik.handleSubmit}>
          <Container maxWidth="xl">
            <FullscreenWrapper>
              <CssBaseline />
              <Box>
                <Paper elevation={3} sx={{ borderRadius: 2 }}>
                  {/* Header */}
                  <Box
                    sx={{
                      bgcolor: "#1a4d8c",
                      color: "white",
                      px: 3,
                      py: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h5" fontWeight={600}>
                      Insurance Protection Policy
                    </Typography>
                  </Box>

                  <Box sx={{ p: 3 }}>
                    {/* Dealership Info */}
                    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body1" fontWeight={600}>
                            {orgOwnerData.org_owner_company_name ||
                              hubspotData.dealership_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {orgOwnerData.org_owner_company_address ||
                              hubspotData.dealership_address}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={1}
                          >
                            Manager: {hubspotData.finance_manager}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={1}
                          >
                            Phone:{" "}
                            {orgOwnerData.org_owner_phone ||
                              hubspotData.dealership_phone}
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          md={6}
                          sx={{ textAlign: { xs: "left", md: "right" } }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Registration: {hubspotData.registration_no_}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Email: {hubspotData.email_address}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    {/* Protection Options */}
                    <Box mb={3}>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        textAlign="center"
                        mb={2}
                      >
                        FINANCE PACKAGES
                      </Typography>

                      {/* Customer & Vehicle Info */}
                      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={5}>
                            <Typography variant="body1">
                              <Box component="span" fontWeight="medium">
                                Vehicle:{" "}
                              </Box>
                              <Box component="span">
                                {hubspotData.make_and_model}
                              </Box>
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              mt={0.5}
                            >
                              VIN/Chassis: {hubspotData.chassis_no_vin}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={2}>
                            {PaymentFrequencyDropdown()}
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Package Cards */}
                      <Grid container spacing={2} mb={3}>
                        {packages.map((pkg, index) => (
                          <Grid
                            item
                            xs={12}
                            sm={6}
                            md={4}
                            lg={packages.length > 4 ? 2.4 : 3}
                            key={index}
                            sx={{
                              minHeight: { xs: "auto", sm: "450px" },
                              "& .MuiCard-root": {
                                height: "100%",
                                width: "100%",
                                minHeight: { xs: "auto", sm: "450px" },
                              },
                            }}
                          >
                            {renderPackageCard(pkg)}
                          </Grid>
                        ))}
                      </Grid>

                      <Typography
                        variant="caption"
                        textAlign="center"
                        fontStyle="italic"
                        color="text.secondary"
                        display="block"
                        mb={3}
                      >
                        IMPORTANT NOTE: The price produced by the calculator is
                        indicative only and does not represent a quote or an
                        offer. It should be used as a guide only.
                      </Typography>
                    </Box>

                    {/* Terms and conditions */}
                    {isTablet ? (
                      <Accordion sx={{ mb: 3 }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls="terms-content"
                          id="terms-header"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            Terms and Conditions
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" mb={1.5}>
                            {orgOwnerData.org_owner_company_name ||
                              hubspotData.dealership_name ||
                              "The dealership"}{" "}
                            arranges this as an agent of Autosure. You should not
                            rely on the information contained in these Finance
                            Protection Options as personal advice. You are solely
                            responsible for taking actions that you may take in
                            reliance upon the information contained on, or accessed
                            through this document. You should consult a qualified
                            adviser for advice on whether these options are suitable
                            for your personal objectives, financial situation and
                            needs.
                          </Typography>
                          <Typography variant="body2">
                            Before making your decision, please consider the
                            relevant Policy Document available from your Business
                            Manager.
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="body2" mb={1.5}>
                          {orgOwnerData.org_owner_company_name ||
                            hubspotData.dealership_name ||
                            "The dealership"}{" "}
                          arranges this as an agent of Autosure. You should not
                          rely on the information contained in these Finance
                          Protection Options as personal advice. You are solely
                          responsible for taking actions that you may take in
                          reliance upon the information contained on, or accessed
                          through this document. You should consult a qualified
                          adviser for advice on whether these options are suitable
                          for your personal objectives, financial situation and
                          needs.
                        </Typography>
                        <Typography variant="body2">
                          Before making your decision, please consider the
                          relevant Policy Document available from your Business
                          Manager.
                        </Typography>
                      </Paper>
                    )}

                    {/* Acknowledgment */}
                    {isTablet ? (
                      <Accordion sx={{ mb: 3 }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls="acknowledgment-content"
                          id="acknowledgment-header"
                        >
                          <Typography variant="body1" fontWeight={600}>
                            Acknowledgment
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" mb={1}>
                            I/we acknowledge that:
                          </Typography>
                          <List dense disablePadding>
                            <ListItem sx={{ py: 0.25 }}>
                              <ListItemText
                                primaryTypographyProps={{ variant: "body2" }}
                                primary="I/we have been provided with, read and understood the Policy Document(s) for the insurance we are applying for."
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.25 }}>
                              <ListItemText
                                primaryTypographyProps={{ variant: "body2" }}
                                primary="I/we will not be insured with any insurance unless I/we complete the insurer's application documentation and that I/we understand that eligibility for insurance is subject to the insurer's underwriting criteria."
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.25 }}>
                              <ListItemText
                                primaryTypographyProps={{ variant: "body2" }}
                                primary="The payment amounts and payment frequencies are indicative only and may vary depending on the finance provider and my personal circumstances. The final amount payable will only be disclosed once my/our application for finance and insurance has been accepted."
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.25 }}>
                              <ListItemText
                                primaryTypographyProps={{ variant: "body2" }}
                                primary="All the repayment options include the loan repayment, the premium for the level of cover purchased and interest on the total amount borrowed. Amount payable will only be disclosed once my/our application for finance and insurance has been accepted."
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.25 }}>
                              <ListItemText
                                primaryTypographyProps={{ variant: "body2" }}
                                primary="The benefits of the insurance products listed above have been fully explained to me and I/we understand the protection that they provide."
                              />
                            </ListItem>
                            <ListItem sx={{ py: 0.25 }}>
                              <ListItemText
                                primaryTypographyProps={{ variant: "body2" }}
                                primary="I/We understand that by electing to decline any of these products, their associated benefits and protection will not apply and hereby waive and decline all such benefits."
                              />
                            </ListItem>
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ) : (
                      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="body1" fontWeight={600} mb={1}>
                          I/we acknowledge that:
                        </Typography>
                        <List dense disablePadding>
                          <ListItem sx={{ py: 0.25 }}>
                            <ListItemText
                              primaryTypographyProps={{ variant: "body2" }}
                              primary="I/we have been provided with, read and understood the Policy Document(s) for the insurance we are applying for."
                            />
                          </ListItem>
                          <ListItem sx={{ py: 0.25 }}>
                            <ListItemText
                              primaryTypographyProps={{ variant: "body2" }}
                              primary="I/we will not be insured with any insurance unless I/we complete the insurer's application documentation and that I/we understand that eligibility for insurance is subject to the insurer's underwriting criteria."
                            />
                          </ListItem>
                          <ListItem sx={{ py: 0.25 }}>
                            <ListItemText
                              primaryTypographyProps={{ variant: "body2" }}
                              primary="The payment amounts and payment frequencies are indicative only and may vary depending on the finance provider and my personal circumstances. The final amount payable will only be disclosed once my/our application for finance and insurance has been accepted."
                            />
                          </ListItem>
                          <ListItem sx={{ py: 0.25 }}>
                            <ListItemText
                              primaryTypographyProps={{ variant: "body2" }}
                              primary="All the repayment options include the loan repayment, the premium for the level of cover purchased and interest on the total amount borrowed. Amount payable will only be disclosed once my/our application for finance and insurance has been accepted."
                            />
                          </ListItem>
                          <ListItem sx={{ py: 0.25 }}>
                            <ListItemText
                              primaryTypographyProps={{ variant: "body2" }}
                              primary="The benefits of the insurance products listed above have been fully explained to me and I/we understand the protection that they provide."
                            />
                          </ListItem>
                          <ListItem sx={{ py: 0.25 }}>
                            <ListItemText
                              primaryTypographyProps={{ variant: "body2" }}
                              primary="I/We understand that by electing to decline any of these products, their associated benefits and protection will not apply and hereby waive and decline all such benefits."
                            />
                          </ListItem>
                        </List>
                      </Paper>
                    )}

                    {/* Package Selection */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                      <Typography
                        variant="h6"
                        textAlign="center"
                        fontWeight={600}
                        mb={2}
                      >
                        Please select your preferred package:
                      </Typography>

                      <RadioGroup
                        row
                        name="package-selection"
                        value={selectedPackage}
                        onChange={(e) => handlePackageChange(e.target.value)}
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {packages.map((pkg, index) => {
                          const packageColor = getPackageColor(pkg.name);
                          return (
                            <FormControlLabel
                              key={index}
                              value={pkg.name}
                              control={<Radio />}
                              label={pkg.name}
                              sx={{
                                m: 0.5,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1,
                                border: `2px solid ${packageColor}`,
                                backgroundColor:
                                  selectedPackage === pkg.name
                                    ? packageColor
                                    : "transparent",
                                color:
                                  selectedPackage === pkg.name
                                    ? packageColor === "#f0c14b" ||
                                      packageColor === "#c0c0c0"
                                      ? "#000"
                                      : "#fff"
                                    : "text.primary",
                                "& .MuiRadio-root": {
                                  color:
                                    selectedPackage === pkg.name
                                      ? packageColor === "#f0c14b" ||
                                        packageColor === "#c0c0c0"
                                        ? "#000"
                                        : "#fff"
                                      : "inherit",
                                },
                              }}
                            />
                          );
                        })}
                      </RadioGroup>

                      {selectedPackage && (
                        <Box
                          mt={3}
                          p={2}
                          bgcolor="rgba(0,0,0,0.03)"
                          borderRadius={1}
                        >
                          <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            mb={1}
                            textAlign="center"
                          >
                            Selected Package Details: {selectedPackage}
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                  mb={1}
                                >
                                  Payment Protection Insurance
                                </Typography>
                                <Stack spacing={1}>
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Status:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight={500}
                                    >
                                      {currentSelectedPackage.ppi
                                        ? "Included"
                                        : "Not Included"}
                                    </Typography>
                                  </Box>
                                  {currentSelectedPackage.ppi && (
                                    <>
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                      >
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          Amount:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={500}
                                        >
                                          {formatCurrency(
                                            currentSelectedPackage.ppiAmount
                                          )}
                                        </Typography>
                                      </Box>
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                      >
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          Cover:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={500}
                                        >
                                          {formatCurrency(
                                            currentSelectedPackage.ppiCover
                                          )}
                                        </Typography>
                                      </Box>
                                    </>
                                  )}
                                </Stack>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                  mb={1}
                                >
                                  Guaranteed Asset Protection
                                </Typography>
                                <Stack spacing={1}>
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Status:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight={500}
                                    >
                                      {currentSelectedPackage.gap
                                        ? "Included"
                                        : "Not Included"}
                                    </Typography>
                                  </Box>
                                  {currentSelectedPackage.gap &&
                                    selectedGapOption && (
                                      <>
                                        <Box
                                          display="flex"
                                          justifyContent="space-between"
                                        >
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            Max Benefit:
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            fontWeight={500}
                                          >
                                            {formatCurrency(
                                              selectedGapOption.maxBenefit
                                            )}
                                          </Typography>
                                        </Box>
                                        <Box
                                          display="flex"
                                          justifyContent="space-between"
                                        >
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            Additional Benefits:
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            fontWeight={500}
                                          >
                                            {formatCurrency(
                                              selectedGapOption.additionalBenefits
                                            )}
                                          </Typography>
                                        </Box>
                                      </>
                                    )}
                                </Stack>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                  mb={1}
                                >
                                  Mechanical Breakdown Insurance
                                </Typography>
                                <Stack spacing={1}>
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                  >
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Status:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight={500}
                                    >
                                      {currentSelectedPackage.mbi
                                        ? "Included"
                                        : "Not Included"}
                                    </Typography>
                                  </Box>
                                  {currentSelectedPackage.mbi && (
                                    <>
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                      >
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          Amount:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={500}
                                        >
                                          {formatCurrency(
                                            currentSelectedPackage.mbiAmount
                                          )}
                                        </Typography>
                                      </Box>
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                      >
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          Type:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          fontWeight={500}
                                        >
                                          {mbiDetails.mbiType}
                                        </Typography>
                                      </Box>
                                    </>
                                  )}
                                </Stack>
                              </Paper>
                            </Grid>
                          </Grid>
                          <Box mt={2} textAlign="center">
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              color="primary"
                            >
                              Total:{" "}
                              {formatCurrency(
                                currentSelectedPackage.totalAmount
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Paper>

                    <Grid container spacing={2} mt={4}>
                      {/* Directors Signature Section */}
                      <Grid item xs={12} sm={12} md={4}>
                        <Grid>
                          <Typography sx={{ fontFamily: "Poppins" }}>
                            Company Signature
                          </Typography>
                        </Grid>
                        <Grid mt={3}>
                          <img
                            src={RentalListingData.user_signature || logo}
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
                          Other Signatures
                        </Typography>
                        <Grid container spacing={2} mt={1}>
                          {signaturesData &&
                          Array.isArray(signaturesData) &&
                          signaturesData.length > 0 ? (
                            signaturesData
                              .slice()
                              .sort(
                                (a, b) => new Date(b.date) - new Date(a.date)
                              )
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
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              mt={3}
                            >
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
                          <IconButton
                            onClick={handleAddSignature}
                            color="primary"
                          >
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
                            E-Sign Here{" "}
                          </Typography>
                        </Grid>{" "}
                        {signatures.map((signature) => (
                          <Paper key={signature.id} sx={{ my: 2, p: 2 }}>
                            <Grid container alignItems="center">
                              <Grid item xs={2} sm={1}>
                                <IconButton
                                  onClick={() =>
                                    handleRemoveSignature(signature.id)
                                  }
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
                  </Box>
                </Paper>
              </Box>
            </FullscreenWrapper>
          </Container>
        </form>
      </Box>
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
    </ThemeProvider>
  );
};

export default AjmInsurance;
