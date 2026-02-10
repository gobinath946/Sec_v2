import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Stack,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
} from "@mui/material";
import { SnackbarProvider, useSnackbar } from "notistack";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import PersonIcon from "@mui/icons-material/Person";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import PayslipComponent from "./PayslipGenerator";

// TabPanel component for tabs content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payslip-tabpanel-${index}`}
      aria-labelledby={`payslip-tab-${index}`}
      {...other}
      style={{ paddingTop: "20px" }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const PayslipTemplateComponent = () => {
  // Add useSnackbar hook
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPdfs, setSelectedPdfs] = useState([]);
  const [previewEmployee, setPreviewEmployee] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const fileInputRef = useRef();
  const payslipRef = useRef();

  // Sample template data
  const templateData = [
    {
      companyName: "COMPANY NAME",
      companyAddress: "COMPANY ADDRESS",
      employeeName: "EMPLOYEE NAME",
      employeeId: "EMP001",
      payPeriod: "MONTH YEAR",
      payDate: "DD/MM/YYYY",
      paidDays: "30",
      lopDays: "0",
      basic: "50000",
      houseRentAllowance: "20000",
      otherAllowance: "10000",
      incomeTax: "5000",
      providentFund: "6000",
      LOPAmount:"850",
      tds: "1000",
    },
  ];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const downloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payslip Template");

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Column A
      { wch: 30 }, // Column B
      { wch: 25 }, // Column C
      { wch: 15 }, // Column D
      { wch: 15 }, // Column E
      { wch: 15 }, // Column F
      { wch: 10 }, // Column G
      { wch: 10 }, // Column H
      { wch: 12 }, // Column I
      { wch: 12 }, // Column J
      { wch: 12 }, // Column K
      { wch: 12 }, // Column L
      { wch: 12 }, // Column M
      { wch: 12 }, // Column N
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "Payslip_Template.xlsx");

    enqueueSnackbar("Template downloaded successfully!", {
      variant: "success",
      autoHideDuration: 3000,
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension !== "xlsx" && fileExtension !== "xls") {
      enqueueSnackbar("Please upload only Excel files (.xlsx or .xls)", {
        variant: "error",
        autoHideDuration: 3000,
      });
      return;
    }

    setIsLoading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          enqueueSnackbar("No data found in the uploaded file", {
            variant: "error",
            autoHideDuration: 3000,
          });
          setIsLoading(false);
          return;
        }

        // Process the data to match our payslip component format
        const processedData = jsonData.map((item) => {
          const basic = parseFloat(item.basic || 0);
          const houseRentAllowance = parseFloat(item.houseRentAllowance || 0);
          const otherAllowance = parseFloat(item.otherAllowance || 0);
          const incomeTax = parseFloat(item.incomeTax || 0);
          const providentFund = parseFloat(item.providentFund || 0);
          const LOPAmount = parseFloat(item.LOPAmount || 0);
          const tds = parseFloat(item.tds || 0);

          const grossEarnings = basic + houseRentAllowance + otherAllowance;
          const totalDeductions = incomeTax + providentFund + tds + LOPAmount;
          const netPayable = grossEarnings - totalDeductions;

          return {
            companyName:
              item.companyName || "TRAILBLAZING ERP APPS SOLUTIONS LLP",
            companyAddress:
              item.companyAddress ||
              "B4 G7 Mahalakshmi Appt City Link Road ADAMBAKKAM - 600 088 India",
            employeeName: item.employeeName || "",
            employeeId: item.employeeId || "",
            payPeriod: item.payPeriod || "",
            payDate: item.payDate || "",
            paidDays: item.paidDays || "0",
            lopDays: item.lopDays || "0",
            totalNetPay: `Rs.${netPayable
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
            earnings: [
              {
                name: "Basic",
                amount: `Rs.${basic
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
              },
              {
                name: "House Rent Allowance",
                amount: `Rs.${houseRentAllowance
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
              },
              {
                name: "Other Allowance",
                amount: `Rs.${otherAllowance
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
              },
              {
                name: "",
                amount: `-`,
              },
            ],
            deductions: [
              {
                name: "Income Tax",
                amount: `Rs.${incomeTax
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
              },
              {
                name: "Provident Fund",
                amount: `Rs.${providentFund
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
              },
              {
                name: "LOP Amount",
                amount: `Rs.${LOPAmount
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
              },
              {
                name: "Tds Deduction",
                amount: `Rs.${tds
                  .toFixed(2)
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
              },
            ],
            grossEarnings: `Rs.${grossEarnings
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
            totalDeductions: `Rs.${totalDeductions
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
            netPayable: `Rs.${netPayable
              .toFixed(2)
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`,
          };
        });

        setEmployees(processedData);
        setCurrentPage(1);
        setPdfs([]);
        setSelectedPdfs([]);
        setTabValue(1); // Switch to the Preview tab

        enqueueSnackbar(
          `Successfully loaded ${processedData.length} employee records`,
          {
            variant: "success",
            autoHideDuration: 3000,
          }
        );
      } catch (error) {
        console.error("Error processing file:", error);
        enqueueSnackbar(
          "Error processing file. Please check the format and try again.",
          {
            variant: "error",
            autoHideDuration: 3000,
          }
        );
      } finally {
        setIsLoading(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const getCurrentEmployee = () => {
    if (employees.length === 0) return null;
    return employees[currentPage - 1];
  };

  const generatePDFs = async () => {
    if (employees.length === 0) {
      enqueueSnackbar("No employee data to convert to PDF", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    setIsConverting(true);
    const generatedPdfs = [];

    try {
      for (let i = 0; i < employees.length; i++) {
        setCurrentPage(i + 1);

        // Wait for the component to render with the current employee data
        await new Promise((resolve) => setTimeout(resolve, 100));

        const element = payslipRef.current;
        if (!element) continue;

        // High resolution capture with optimized settings
        const canvas = await html2canvas(element, {
          scale: 4, // Higher scale for better resolution
          useCORS: true,
          logging: false,
          allowTaint: false,
          backgroundColor: "#ffffff",
        });

        // Balance between quality and file size (0.85 quality)
        const imgData = canvas.toDataURL("image/jpeg", 0.85);

        // Create a custom-sized PDF that matches the image dimensions
        const imgProps = {
          width: canvas.width,
          height: canvas.height,
        };

        // Convert pixel dimensions to mm (assuming 96 DPI)
        const pxToMm = 0.264583;
        const widthInMm = Math.ceil(imgProps.width * pxToMm);
        const heightInMm = Math.ceil(imgProps.height * pxToMm);

        // Create a PDF with custom dimensions that match the image exactly
        const pdf = new jsPDF({
          orientation: widthInMm > heightInMm ? "landscape" : "portrait",
          unit: "mm",
          format: [widthInMm, heightInMm],
        });

        // Add the image to fill the entire PDF (starting from top)
        pdf.addImage(imgData, "JPEG", 0, 0, widthInMm, heightInMm);

        // Compression options for the output
        const pdfOptions = {
          compress: true,
        };

        const blob = pdf.output("blob", pdfOptions);
        const url = URL.createObjectURL(blob);

        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split("T")[0];
        const formattedTime = currentDate
          .toTimeString()
          .split(" ")[0]
          .replace(/:/g, "-");

        generatedPdfs.push({
          id: i,
          employeeName: employees[i].employeeName,
          payPeriod: employees[i].payPeriod,
          filename: `${employees[i].employeeName.replace(
            /\s+/g,
            "_"
          )}_${formattedDate}_${formattedTime}.pdf`,
          url: url,
          blob: blob,
          size: (blob.size / (1024 * 1024)).toFixed(2), // Size in MB for logging
        });

        // Update progress and log file size
        const progress = Math.round(((i + 1) / employees.length) * 100);
        console.log(
          `PDF Generation Progress: ${progress}% | Size: ${generatedPdfs[i].size} MB`
        );
      }

      setPdfs(generatedPdfs);
      setCurrentPage(1);
      setTabValue(2); // Switch to the PDFs tab

      enqueueSnackbar(
        `Successfully generated ${generatedPdfs.length} PDF files`,
        {
          variant: "success",
          autoHideDuration: 3000,
        }
      );
    } catch (error) {
      console.error("Error generating PDFs:", error);
      enqueueSnackbar("Error generating PDFs. Please try again.", {
        variant: "error",
        autoHideDuration: 3000,
      });
    } finally {
      setIsConverting(false);
    }
  };
  // const generatePDFs = async () => {
  //   if (employees.length === 0) {
  //     enqueueSnackbar("No employee data to convert to PDF", {
  //       variant: "warning",
  //       autoHideDuration: 3000
  //     });
  //     return;
  //   }

  //   setIsConverting(true);
  //   const generatedPdfs = [];

  //   try {
  //     for (let i = 0; i < employees.length; i++) {
  //       setCurrentPage(i + 1);

  //       // Wait for the component to render with the current employee data
  //       await new Promise(resolve => setTimeout(resolve, 100));

  //       const element = payslipRef.current;
  //       if (!element) continue;

  //       // High resolution with balanced compression
  //       const canvas = await html2canvas(element, {
  //         scale: 5, // Higher scale for better quality
  //         useCORS: true,
  //         logging: false,
  //         allowTaint: false,
  //         backgroundColor: '#ffffff'
  //       });

  //       // Higher resolution image with medium compression to stay under 2MB
  //       const imgData = canvas.toDataURL('image/jpeg', 1);

  //       // Create custom sized PDF that matches image dimensions exactly
  //       const imgWidth = canvas.width;
  //       const imgHeight = canvas.height;

  //       // Convert to mm (standard PDF unit)
  //       const pdfWidthMm = 210; // A4 width
  //       const pdfHeightMm = (imgHeight * pdfWidthMm) / imgWidth;

  //       // Create custom sized PDF
  //       const pdf = new jsPDF({
  //         orientation: 'portrait',
  //         unit: 'mm',
  //         format: [pdfWidthMm, pdfHeightMm] // Custom format that matches image aspect ratio
  //       });

  //       // Add image at the top of the page (y=0)
  //       pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidthMm, pdfHeightMm);

  //       // Set compression options
  //       const pdfOptions = {
  //         compress: true
  //       };

  //       const blob = pdf.output('blob', pdfOptions);
  //       const url = URL.createObjectURL(blob);

  //       const currentDate = new Date();
  //       const formattedDate = currentDate.toISOString().split('T')[0];
  //       const formattedTime = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');

  //       generatedPdfs.push({
  //         id: i,
  //         employeeName: employees[i].employeeName,
  //         payPeriod: employees[i].payPeriod,
  //         filename: `${employees[i].employeeName.replace(/\s+/g, '_')}_${formattedDate}_${formattedTime}.pdf`,
  //         url: url,
  //         blob: blob
  //       });

  //       // Update progress
  //       const progress = Math.round(((i + 1) / employees.length) * 100);
  //       console.log(`PDF Generation Progress: ${progress}%`);
  //     }

  //     setPdfs(generatedPdfs);
  //     setCurrentPage(1);
  //     setTabValue(2); // Switch to the PDFs tab

  //     enqueueSnackbar(`Successfully generated ${generatedPdfs.length} PDF files`, {
  //       variant: "success",
  //       autoHideDuration: 3000
  //     });

  //   } catch (error) {
  //     console.error("Error generating PDFs:", error);
  //     enqueueSnackbar("Error generating PDFs. Please try again.", {
  //       variant: "error",
  //       autoHideDuration: 3000
  //     });
  //   } finally {
  //     setIsConverting(false);
  //   }
  // };

  // const generatePDFs = async () => {
  //   if (employees.length === 0) {
  //     enqueueSnackbar("No employee data to convert to PDF", {
  //       variant: "warning",
  //       autoHideDuration: 3000
  //     });
  //     return;
  //   }

  //   setIsConverting(true);
  //   const generatedPdfs = [];

  //   try {
  //     for (let i = 0; i < employees.length; i++) {
  //       setCurrentPage(i + 1);

  //       // Wait for the component to render with the current employee data
  //       await new Promise(resolve => setTimeout(resolve, 100));

  //       const element = payslipRef.current;
  //       if (!element) continue;

  //       // Reduced quality and scale for better performance
  //       const canvas = await html2canvas(element, {
  //         scale:5, // Reduced from 2 to 1.5 for better performance
  //         useCORS: true,
  //         logging: false,
  //         allowTaint: false
  //       });

  //       const imgData = canvas.toDataURL('image/png', 0.8); // Reduced quality (0.8 instead of default 0.92)
  //       const pdf = new jsPDF('p', 'mm', 'a4');
  //       const imgProps = pdf.getImageProperties(imgData);
  //       const pdfWidth = pdf.internal.pageSize.getWidth();
  //       const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  //       // Reduced height to ensure it fits well on the page
  //       const adjustedHeight = Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 10);

  //       pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, adjustedHeight);

  //       const blob = pdf.output('blob');
  //       const url = URL.createObjectURL(blob);

  //       const currentDate = new Date();
  //       const formattedDate = currentDate.toISOString().split('T')[0];
  //       const formattedTime = currentDate.toTimeString().split(' ')[0].replace(/:/g, '-');

  //       generatedPdfs.push({
  //         id: i,
  //         employeeName: employees[i].employeeName,
  //         payPeriod: employees[i].payPeriod,
  //         filename: `${employees[i].employeeName.replace(/\s+/g, '_')}_${formattedDate}_${formattedTime}.pdf`,
  //         url: url,
  //         blob: blob
  //       });

  //       // Update progress
  //       const progress = Math.round(((i + 1) / employees.length) * 100);
  //       console.log(`PDF Generation Progress: ${progress}%`);
  //     }

  //     setPdfs(generatedPdfs);
  //     setCurrentPage(1);
  //     setTabValue(2); // Switch to the PDFs tab

  //     enqueueSnackbar(`Successfully generated ${generatedPdfs.length} PDF files`, {
  //       variant: "success",
  //       autoHideDuration: 3000
  //     });

  //   } catch (error) {
  //     console.error("Error generating PDFs:", error);
  //     enqueueSnackbar("Error generating PDFs. Please try again.", {
  //       variant: "error",
  //       autoHideDuration: 3000
  //     });
  //   } finally {
  //     setIsConverting(false);
  //   }
  // };

  // const generatePDFs = async () => {
  //   if (employees.length === 0) {
  //     enqueueSnackbar("No employee data to convert to PDF", {
  //       variant: "warning",
  //       autoHideDuration: 3000,
  //     });
  //     return;
  //   }

  //   setIsConverting(true);
  //   const generatedPdfs = [];

  //   try {
  //     for (let i = 0; i < employees.length; i++) {
  //       setCurrentPage(i + 1);

  //       // Wait for the component to render with the current employee data
  //       await new Promise((resolve) => setTimeout(resolve, 100));

  //       const element = payslipRef.current;
  //       if (!element) continue;

  //       // Optimized quality settings
  //       const canvas = await html2canvas(element, {
  //         scale: 3, // Balanced scale for quality and file size
  //         useCORS: true,
  //         logging: false,
  //         allowTaint: false,
  //         backgroundColor: "#ffffff",
  //       });

  //       // Compress image with better quality
  //       const imgData = canvas.toDataURL("image/jpeg", 0.9);
  //       const pdf = new jsPDF("p", "mm", "a4");
  //       const imgProps = pdf.getImageProperties(imgData);
  //       const pdfWidth = pdf.internal.pageSize.getWidth();

  //       // Calculate height while maintaining aspect ratio
  //       const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  //       // Add 20px of padding (converted to mm)
  //       const paddingInMm = 20 * 0.264583; // Convert pixels to mm
  //       const pageHeight = pdf.internal.pageSize.getHeight();
  //       console.log(pageHeight);
  //       console.log(pdfHeight);
  //       console.log(Math.max(0, (pageHeight - pdfHeight) / 2));
  //       // Calculate the vertical position to center the image with padding
  //       const yPosition = Math.max(0, (pageHeight - pdfHeight) / 2);

  //       // Add image with the adjusted positioning
  //       pdf.addImage(imgData, "JPEG", 0, yPosition, pdfWidth, pdfHeight);

  //       // Compress the PDF
  //       const pdfOptions = {
  //         compress: true,
  //         precision: 2,
  //         userUnit: 1.0,
  //       };

  //       const blob = pdf.output("blob", pdfOptions);
  //       const url = URL.createObjectURL(blob);

  //       const currentDate = new Date();
  //       const formattedDate = currentDate.toISOString().split("T")[0];
  //       const formattedTime = currentDate
  //         .toTimeString()
  //         .split(" ")[0]
  //         .replace(/:/g, "-");

  //       generatedPdfs.push({
  //         id: i,
  //         employeeName: employees[i].employeeName,
  //         payPeriod: employees[i].payPeriod,
  //         filename: `${employees[i].employeeName.replace(
  //           /\s+/g,
  //           "_"
  //         )}_${formattedDate}_${formattedTime}.pdf`,
  //         url: url,
  //         blob: blob,
  //       });

  //       // Update progress
  //       const progress = Math.round(((i + 1) / employees.length) * 100);
  //       console.log(`PDF Generation Progress: ${progress}%`);
  //     }

  //     setPdfs(generatedPdfs);
  //     setCurrentPage(1);
  //     setTabValue(2); // Switch to the PDFs tab

  //     enqueueSnackbar(
  //       `Successfully generated ${generatedPdfs.length} PDF files`,
  //       {
  //         variant: "success",
  //         autoHideDuration: 3000,
  //       }
  //     );
  //   } catch (error) {
  //     console.error("Error generating PDFs:", error);
  //     enqueueSnackbar("Error generating PDFs. Please try again.", {
  //       variant: "error",
  //       autoHideDuration: 3000,
  //     });
  //   } finally {
  //     setIsConverting(false);
  //   }
  // };

  const handlePdfSelection = (id) => {
    setSelectedPdfs((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pdfId) => pdfId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedPdfs(pdfs.map((pdf) => pdf.id));
    } else {
      setSelectedPdfs([]);
    }
  };

  const downloadSelectedPdfs = () => {
    if (selectedPdfs.length === 0) {
      enqueueSnackbar("Please select at least one PDF to download", {
        variant: "warning",
        autoHideDuration: 3000,
      });
      return;
    }

    selectedPdfs.forEach((id) => {
      const pdf = pdfs.find((pdf) => pdf.id === id);
      if (pdf) {
        const link = document.createElement("a");
        link.href = pdf.url;
        link.download = pdf.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });

    enqueueSnackbar(`Downloaded ${selectedPdfs.length} PDF file(s)`, {
      variant: "success",
      autoHideDuration: 3000,
    });
  };

  const handlePreview = (employee) => {
    setPreviewEmployee(employee);
    setOpenPreview(true);
  };

  const handleDeletePdf = (id) => {
    setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
    setSelectedPdfs((prev) => prev.filter((pdfId) => pdfId !== id));

    enqueueSnackbar("PDF deleted successfully", {
      variant: "success",
      autoHideDuration: 3000,
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Modern Header */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 3,
          background: "linear-gradient(90deg, #2196F3, #21CBF3)",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: "white",
            textAlign: "center",
          }}
        >
          QRS Payslip Generator
        </Typography>
      </Paper>

      {/* Tabs Navigation */}
      <Paper elevation={3} sx={{ borderRadius: 3, mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label="Setup"
            icon={<SettingsIcon />}
            iconPosition="start"
            sx={{ fontWeight: 600, py: 2 }}
          />
          <Tab
            label="Preview"
            icon={<PersonIcon />}
            iconPosition="start"
            disabled={employees.length === 0}
            sx={{ fontWeight: 600, py: 2 }}
          />
          <Tab
            label="Generated PDFs"
            icon={<PictureAsPdfOutlinedIcon />}
            iconPosition="start"
            disabled={pdfs.length === 0}
            sx={{ fontWeight: 600, py: 2 }}
          />
        </Tabs>

        {/* Setup Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ mb: 3, fontWeight: 600 }}
            >
              Generate payslips for your employees by following these steps:
            </Typography>

            <Stack spacing={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  1.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudDownloadIcon />}
                  onClick={downloadTemplate}
                  sx={{ fontWeight: 600 }}
                >
                  Download Template
                </Button>
                <Typography variant="body1">
                  Download the Excel template and fill in your employee data
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  2.
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<FileUploadIcon />}
                  sx={{ fontWeight: 600 }}
                  disabled={isLoading}
                >
                  Upload Excel
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    hidden
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                  />
                </Button>
                <Typography variant="body1">
                  Upload your filled Excel file with employee payslip data
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  3.
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={generatePDFs}
                  disabled={isConverting || employees.length === 0}
                  sx={{ fontWeight: 600 }}
                >
                  {isConverting ? "Converting..." : "Convert All to PDF"}
                </Button>
                <Typography variant="body1">
                  Convert all employee payslips to PDF format
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  4.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<FileDownloadIcon />}
                  onClick={downloadSelectedPdfs}
                  disabled={selectedPdfs.length === 0}
                  sx={{ fontWeight: 600 }}
                >
                  Download PDFs
                </Button>
                <Typography variant="body1">
                  Download the generated PDF files
                </Typography>
              </Box>
            </Stack>
          </Box>
        </TabPanel>

        {/* Preview Tab */}
        <TabPanel value={tabValue} index={1}>
          {employees.length > 0 && getCurrentEmployee() && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 3,
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Payslip Preview
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Employee {currentPage} of {employees.length}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={generatePDFs}
                  disabled={isConverting}
                  sx={{ fontWeight: 600 }}
                >
                  {isConverting ? "Converting..." : "Convert All to PDF"}
                </Button>
              </Box>
              {/* <Box sx={{ display: "flex", justifyContent: "center", my: 5, }}>
                <Pagination
                  count={employees.length}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  siblingCount={1}
                  boundaryCount={1}
                />
              </Box>
              <Box sx={{ p: 3, position: "relative" }} ref={payslipRef}>
                <PayslipComponent payslipData={getCurrentEmployee()} />
              </Box> */}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  my: 5,
                }}
              >
                <IconButton
                  onClick={() =>
                    handlePageChange(
                      null,
                      currentPage > 1 ? currentPage - 1 : currentPage
                    )
                  }
                  disabled={currentPage === 1}
                  className="greeny"
                  sx={{
                    mx: 2,
                    color: "white", // Icon color
                    width: 48, // Adjust size
                    height: 48, // Adjust size
                    borderRadius: "50%", // Makes it a circle
                    "&:hover": {
                      bgcolor: "darkgreen", // Hover effect
                    },
                  }}
                >
                  <ChevronLeftIcon fontSize="large" sx={{ color: "white" }} />
                </IconButton>

                <Box
                  sx={{ p: 3, position: "relative", width: "100%" }}
                  ref={payslipRef}
                >
                  <PayslipComponent payslipData={getCurrentEmployee()} />
                </Box>

                <IconButton
                  onClick={() =>
                    handlePageChange(
                      null,
                      currentPage < employees.length
                        ? currentPage + 1
                        : currentPage
                    )
                  }
                  disabled={currentPage === employees.length}
                  className="greeny"
                  sx={{
                    mx: 2,
                    color: "white", // Icon color
                    width: 48, // Adjust size
                    height: 48, // Adjust size
                    borderRadius: "50%", // Makes it a circle
                    "&:hover": {
                      bgcolor: "darkgreen", // Hover effect
                    },
                  }}
                >
                  <ChevronRightIcon fontSize="large" sx={{ color: "white" }} />
                </IconButton>
              </Box>
            </>
          )}
        </TabPanel>

        {/* Generated PDFs Tab */}
        <TabPanel value={tabValue} index={2}>
          {pdfs.length > 0 && (
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontWeight: 600 }}
                >
                  Generated PDFs ({pdfs.length})
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<FileDownloadIcon />}
                  onClick={downloadSelectedPdfs}
                  disabled={selectedPdfs.length === 0}
                  sx={{ fontWeight: 600 }}
                >
                  Download Selected ({selectedPdfs.length})
                </Button>
              </Box>

              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={
                            selectedPdfs.length > 0 &&
                            selectedPdfs.length < pdfs.length
                          }
                          checked={
                            pdfs.length > 0 &&
                            selectedPdfs.length === pdfs.length
                          }
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>No.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Employee Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Pay Period</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Filename</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pdfs.map((pdf, index) => (
                      <TableRow key={pdf.id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedPdfs.includes(pdf.id)}
                            onChange={() => handlePdfSelection(pdf.id)}
                          />
                        </TableCell>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {pdf.employeeName}
                        </TableCell>
                        <TableCell>{pdf.payPeriod}</TableCell>
                        <TableCell>{pdf.filename}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Preview">
                              <IconButton
                                color="primary"
                                onClick={() => handlePreview(employees[pdf.id])}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                color="success"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = pdf.url;
                                  link.download = pdf.filename;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => handleDeletePdf(pdf.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading || isConverting}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {isLoading ? "Processing Data..." : "Converting to PDF..."}
          </Typography>
        </Box>
      </Backdrop>

      {/* Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Payslip Preview - {previewEmployee?.employeeName}
        </DialogTitle>
        <DialogContent>
          {previewEmployee && (
            <PayslipComponent payslipData={previewEmployee} />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPreview(false)}
            sx={{ fontWeight: 600 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Wrapper component to provide SnackbarProvider
const PayslipTemplateWrapper = () => {
  return (
    <SnackbarProvider
      maxSnack={3}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <PayslipTemplateComponent />
    </SnackbarProvider>
  );
};

export default PayslipTemplateWrapper;
