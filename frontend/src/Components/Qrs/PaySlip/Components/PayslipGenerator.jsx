import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Container,
  ThemeProvider,
  createTheme,
  useMediaQuery,
} from "@mui/material";
import Logo from "../Images/Logo_small.png";

// Create a custom theme to match the payslip look with improved typography
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#f5f5f5",
    },
    grey: {
      main: "#757575",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "0.95rem",
    },
    body2: {
      fontSize: "0.85rem",
    },
    caption: {
      fontSize: "0.75rem",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "10px 16px",
        },
      },
    },
  },
});

// Function to convert number to words
const convertToWords = (amount) => {
  // Remove "Rs." and commas, then convert to number
  const numericAmount = parseFloat(amount.replace("Rs.", "").replace(/,/g, ""));

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertLessThanOneThousand = (num) => {
    if (num === 0) return "";

    let result = "";

    if (num < 10) result = units[num];
    else if (num < 20) result = teens[num - 10];
    else if (num < 100) {
      result = tens[Math.floor(num / 10)];
      if (num % 10 > 0) result += "-" + units[num % 10];
    } else {
      result = units[Math.floor(num / 100)] + " Hundred";
      if (num % 100 > 0) result += " " + convertLessThanOneThousand(num % 100);
    }

    return result;
  };

  if (numericAmount === 0) return "Zero";

  let result = "";
  let num = Math.floor(numericAmount);
  let paisa = Math.round((numericAmount - num) * 100);

  if (num >= 100000) {
    result += convertLessThanOneThousand(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }

  if (num >= 1000) {
    result += convertLessThanOneThousand(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }

  if (num > 0) {
    result += convertLessThanOneThousand(num);
  }

  if (paisa > 0) {
    result += " and " + convertLessThanOneThousand(paisa) + " Paisa";
  }

  return "Indian Rupee " + result.trim() + " Only";
};

const PayslipComponent = ({ payslipData }) => {
  const amountInWords = convertToWords(payslipData.netPayable);

  const getCurrentMonthYear = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.toLocaleString("en-US", { month: "long" }).toUpperCase();
    return `${year} ${month}`;
  };

  // Use media query for responsive design
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: { xs: "column", md: "row" },
              textAlign: "center",
              px: { xs: 1, sm: 2 },
              py: 2,
              mb: 3,
              borderBottom: "2px solid #9e9e9e",
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-start" },
                width: { xs: "100%", md: "auto" },
              }}
            >
              <img
                src={Logo}
                height="60px"
                style={{ maxWidth: "100%" }}
                alt="Logo"
              />
            </Box>

            <Box sx={{ flexGrow: 1, my: { xs: 2, md: 0 } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                  mb: 1,
                }}
              >
                TRAILBLAZING ERP APPS SOLUTIONS LLP
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
                  fontWeight: 400,
                  color: "#555",
                }}
              >
                B4 G7 Mahalakshmi Appt City Link Road ADAMBAKKAM - 600 088 India
              </Typography>
            </Box>

            <Box sx={{ textAlign: { xs: "center", md: "right" } }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: "bold",
                  mb: 0.5,
                  fontSize: { xs: "0.8rem", sm: "0.9rem", md: "1rem" },
                }}
              >
                Payslip For the Month
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "primary.main",
                  fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                }}
              >
               {payslipData.payPeriod}
              </Typography>
            </Box>
          </Box>

          {/* Employee Summary Section */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontWeight: "bold",
                    color: "black",
                    p: 1,
                    pl: 0,
                    fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" },
                  }}
                >
                  EMPLOYEE SUMMARY
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, p: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "600",
                        minWidth: "130px",
                        color: "grey",
                      }}
                    >
                      Employee Name :
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>
                      {payslipData.employeeName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, p: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "600",
                        minWidth: "130px",
                        color: "grey",
                      }}
                    >
                      Employee ID :
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>
                      {payslipData.employeeId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, p: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "600",
                        minWidth: "130px",
                        color: "grey",
                      }}
                    >
                      Pay Period :
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>
                      {payslipData.payPeriod}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, p: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: "600",
                        minWidth: "130px",
                        color: "grey",
                      }}
                    >
                      Pay Date :
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>
                      {payslipData.payDate}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    border: "2px solid #9e9e9e",
                    borderRadius: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      textAlign: "left",
                      borderBottom: "1px dotted #9e9e9e",
                      display: "flex",
                      flexDirection: "column",
                      background: "hsl(19deg 98% 81% / 50%)",
                    }}
                  >
                    <Grid
                      sx={{
                        borderLeft: "3px solid #fe8348",
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          color: "#007bdb",
                          mb: 1,
                          fontSize: "28px",
                          pl: 2,
                        }}
                      >
                        {payslipData.totalNetPay}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "medium", textAlign: "left", pl: 2 }}
                      >
                        Total Net Pay
                      </Typography>
                    </Grid>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", minWidth: "80px" }}
                      >
                        Paid Days :
                      </Typography>
                      <Typography variant="body2">
                        {payslipData.paidDays}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: "bold", minWidth: "80px",color:"red" }}
                      >
                        LOP Days :
                      </Typography>
                      <Typography variant="body2" sx={{color:"red"}}>
                        {payslipData.lopDays}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Earnings and Deductions */}
          <Grid container spacing={0}>
            {/* Earnings and Deductions Tables */}
            <Grid item xs={12}>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: "1px solid #9e9e9e",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: "100%", md: "50%" },
                      borderRight: { xs: "none", md: "1px solid #9e9e9e" },
                    }}
                  >
                    <Table>
                      <TableBody>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "1px solid #9e9e9e",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            EARNINGS
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "1px solid #9e9e9e",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            AMOUNT
                          </TableCell>
                        </TableRow>
                        {payslipData.earnings.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{
                                borderBottom:
                                  index === payslipData.earnings.length - 1
                                    ? "1px solid #9e9e9e"
                                    : "1px solid #e0e0e0",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                color: "grey",
                                fontWeight: "600",
                              }}
                            >
                              {item.name}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  index === payslipData.earnings.length - 1
                                    ? "1px solid #9e9e9e"
                                    : "1px solid #e0e0e0",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                fontWeight: "600",
                              }}
                            >
                              {item.amount}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "none",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            Gross Earnings
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "none",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            {payslipData.grossEarnings}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                  <Box sx={{ width: { xs: "100%", md: "50%" } }}>
                    <Table>
                      <TableBody>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "1px solid #9e9e9e",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            DEDUCTIONS
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "1px solid #9e9e9e",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            AMOUNT
                          </TableCell>
                        </TableRow>
                        {payslipData.deductions.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell
                              sx={{
                                borderBottom:
                                  index === payslipData.deductions.length - 1
                                    ? "1px solid #9e9e9e"
                                    : "1px solid #e0e0e0",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                color: "grey",
                                fontWeight: "600",
                              }}
                            >
                              {item.name}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                borderBottom:
                                  index === payslipData.deductions.length - 1
                                    ? "1px solid #9e9e9e"
                                    : "1px solid #e0e0e0",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                fontWeight: "600",
                              }}
                            >
                              {item.amount}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "none",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            Total Deductions
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: "bold",
                              borderBottom: "none",
                              borderTop: "none",
                              borderLeft: "none",
                              borderRight: "none",
                            }}
                          >
                            {payslipData.totalDeductions}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              </TableContainer>
            </Grid>
          </Grid>

          {/* Total Net Payable */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              bgcolor: "#f5f5f5",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              TOTAL NET PAYABLE
            </Typography>
            <Grid container>
              <Grid item xs={12} md={8}>
                <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                  Gross Earnings - Total Deductions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "bold",
                    textAlign: { xs: "left", md: "right" },
                    mt: { xs: 1, md: 0 },
                  }}
                >
                  {payslipData.netPayable}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Amount in Words - Dynamically calculated */}
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Typography
              variant="body2"
              sx={{
                fontStyle: "italic",
                color: "#555",
              }}
            >
              Amount In Words:
              <span style={{ fontWeight: "600" }}>{amountInWords}</span>
            </Typography>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              textAlign: "center",
              mt: 4,
              pt: 2,
              borderTop: "1px dashed #ccc",
            }}
          >
            <Typography variant="caption" sx={{ color: "grey.600" }}>
              -- This is a system-generated document. --
            </Typography>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default PayslipComponent;
