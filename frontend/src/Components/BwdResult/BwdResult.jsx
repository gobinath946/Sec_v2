import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Typography,
  Box,
  Container,
  Fade,
  Grow,
  Stack,
  Divider,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DangerousOutlinedIcon from "@mui/icons-material/DangerousOutlined";
import CopyrightIcon from "@mui/icons-material/Copyright";
import LaunchIcon from "@mui/icons-material/Launch";
import { useLocation, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config";
import axios from "axios";
import ImageDistributor from "../ImagesProvider/ImageDistributor";
import logo from "../../Assets/Images/Securegateway-Gradient.png";

// Modern Responsive Footer Component
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3 },
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        borderTop: "1px solid",
        borderColor: "divider",
        mt: "auto",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%)",
        },
      }}
    >
      <Container maxWidth="lg">
        {/* Mobile Layout */}
        <Box sx={{ display: { xs: "flex", sm: "none" } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            {/* Copyright Section */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CopyrightIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "text.secondary",
                  letterSpacing: "0.3px",
                }}
              >
                {currentYear} All rights reserved
              </Typography>
            </Box>

            {/* Logo Section */}
            <Box
              component="a"
              href="https://securegateway.io/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                transition: "all 0.3s ease",
                borderRadius: 2,
                p: 1,
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                },
              }}
            >
              <img 
                src={logo} 
                alt="SecureGateway Logo" 
                style={{ height: "32px", width: "auto" }} 
              />
              <LaunchIcon 
                sx={{ 
                  fontSize: 14, 
                  ml: 1, 
                  color: "text.secondary",
                  opacity: 0.7,
                }} 
              />
            </Box>
          </Box>
        </Box>

        {/* Tablet and Desktop Layout */}
        <Box sx={{ display: { xs: "none", sm: "flex" } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {/* Left Side - Copyright */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                p: 1.5,
                borderRadius: 2,
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <CopyrightIcon sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography
                variant="body2"
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "text.primary",
                  letterSpacing: "0.3px",
                }}
              >
                {currentYear} All rights reserved
              </Typography>
            </Box>

            {/* Right Side - Logo */}
            <Box
              component="a"
              href="https://securegateway.io/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                transition: "all 0.3s ease",
                borderRadius: 2,
                p: 1.5,
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                  background: "rgba(255,255,255,1)",
                },
              }}
            >
              <img 
                src={logo} 
                alt="SecureGateway Logo" 
                style={{ height: "40px", width: "auto" }} 
              />
              <LaunchIcon 
                sx={{ 
                  fontSize: 16, 
                  ml: 1, 
                  color: "primary.main",
                  opacity: 0.7,
                  transition: "all 0.3s ease",
                }} 
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

const SbhoResult = () => {
  const location = useLocation();
  const isSuccessPage = location.pathname.includes("/success");
  const isErrorPage = location.pathname.includes("/error");
  const navigate = useNavigate();
  const uid = sessionStorage.getItem("uid");
  const Tempname = sessionStorage.getItem("TempName");
  const [branding, setBranding] = useState(null);
  const [cus_id, setCus_id] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/message_branding/${uid}`);
        const branding = response.data.branding;
        const ResultPageBrandingdata = branding.branding_color.find(
          (brand) => brand.page_name === "Result_Page"
        );
        setBranding(ResultPageBrandingdata);
        setCus_id(response.data.cus_id);
      } catch (error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message === "Message not found"
        ) {
          navigate(`/result/error/${Tempname}Result`);
        } else {
          console.error("Error fetching data:", error);
          navigate(`/result/error/${Tempname}Result`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid, navigate, Tempname]);

  useEffect(() => {
    const disableBackButton = () => {
      window.history.pushState(null, "", window.location.href);
    };

    const handleBackButton = (event) => {
      event.preventDefault();
      if (isSuccessPage) {
        navigate(`/result/success/${Tempname}Result`);
      } else {
        navigate(`/result/error/${Tempname}Result`);
      }
    };

    disableBackButton();
    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [navigate, isSuccessPage, Tempname]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 1, sm: 2 },
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Paper
            elevation={8}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              minHeight: "70vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* Header Section with Logo */}
            <Box
              sx={{
                p: { xs: 2, sm: 3 },
                textAlign: "center",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <ImageDistributor
                uid={cus_id}
                logo={"Main_Logo"}
                width={"50%"}
                height={"auto"}
              />
            </Box>

            {/* Main Content Section */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 3, sm: 4 },
                textAlign: "center",
              }}
            >
              {isSuccessPage && (
                <Grow in timeout={1000}>
                  <Box
                    sx={{
                      maxWidth: 400,
                      mx: "auto",
                    }}
                  >
                    <Box
                      sx={{
                        mb: 3,
                        p: 1,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
                        boxShadow: "0 4px 20px rgba(76, 175, 80, 0.3)",
                      }}
                    >
                      <CheckCircleOutlineIcon
                        sx={{
                          fontSize: { xs: 60, sm: 80 },
                          color: "white",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.5rem", sm: "2rem" },
                        color: branding?.styles?.success_heading?.color || "success.main",
                        mb: 2,
                        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      THANK YOU!
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 500,
                        fontSize: { xs: "1rem", sm: "1.125rem" },
                        color: branding?.styles?.success_description?.color || "text.primary",
                        lineHeight: 1.6,
                        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      Your response was submitted successfully.
                    </Typography>

                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: "success.light",
                        display: "inline-block",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: "success.main",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        SUBMITTED
                      </Typography>
                    </Box>
                  </Box>
                </Grow>
              )}

              {isErrorPage && (
                <Grow in timeout={1000}>
                  <Box
                    sx={{
                      maxWidth: 400,
                      mx: "auto",
                    }}
                  >
                    <Box
                      sx={{
                        mb: 3,
                        p: 1,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #f44336 0%, #ef5350 100%)",
                        boxShadow: "0 4px 20px rgba(244, 67, 54, 0.3)",
                      }}
                    >
                      <DangerousOutlinedIcon
                        sx={{
                          fontSize: { xs: 60, sm: 80 },
                          color: "white",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.5rem", sm: "2rem" },
                        color: branding?.styles?.error_heading?.color || "error.main",
                        mb: 2,
                        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      Oops. Sorry!
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 500,
                        fontSize: { xs: "1rem", sm: "1.125rem" },
                        color: branding?.styles?.error_description?.color || "text.primary",
                        lineHeight: 1.6,
                        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      }}
                    >
                      Since your service is closed, the link will no longer be accessible.
                    </Typography>
                  </Box>
                </Grow>
              )}
            </Box>

            {/* Footer Section */}
            <Footer />
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default SbhoResult;