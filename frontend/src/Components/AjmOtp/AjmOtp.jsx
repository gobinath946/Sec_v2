import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Modal,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import "./Otp.css";
import { useNavigate } from "react-router-dom";
import Footer from "../Footer/Footer";
import { useAuth } from "../PrivateRoute/AuthContext.jsx";
import { BASE_URL } from "../../config";
import { useSnackbar } from "notistack";
import ImageDistributor from "../ImagesProvider/ImageDistributor";

const Otp = () => {
  // State management
  const [cus_id, setCus_id] = useState(null);
  const [link, setLink] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [userInfo, setUserInfo] = useState({
    number: "",
    email: "",
    cus_id: null,
    action: "",
    otp_source: null,
  });
  const [uiState, setUiState] = useState({
    isLoading: true,
    showVerification: false,
    showResend: false,
    otpSent: false,
    inputTouched: false,
  });
  const [timer, setTimer] = useState(15);
  const [resendCount, setResendCount] = useState(0);
  const [error, setError] = useState({ message: null, showModal: false });
  const [otpPageBranding, setOtpPageBranding] = useState(null);

  // Refs and hooks
  const verificationInputRef = useRef();
  const { setAuthentication } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  // Constants
  const uid = sessionStorage.getItem("uid");
  const tempName = sessionStorage.getItem("TempName");
  const stepper_email = sessionStorage.getItem("stepper_email");
  const action = sessionStorage.getItem("action");

  // Timer effect
  useEffect(() => {
    let interval;
    if (uiState.showResend && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setUiState((prev) => ({ ...prev, showResend: false }));
      if (resendCount < 1) {
        setTimer(15);
      }
    }
    return () => clearInterval(interval);
  }, [uiState.showResend, timer, resendCount]);

  // Initialize component data
  useEffect(() => {
    const initializeData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/message/${uid}`);
        const { message: data, branding } = response.data;

        if (!data) {
          navigate(`/result/error/${tempName}Result`);
          return;
        }

        // Check if already authenticated
        const auth = sessionStorage.getItem("auth");
        if (auth === "true") {
          navigate(`/messagedetail/${data.action}/${tempName}/${uid}`);
          return;
        }

        // Set branding
        const otpBranding = branding?.branding_color?.find(
          (brand) => brand.page_name === "Otp_Page"
        );
        setOtpPageBranding(otpBranding);
        if (data.action === "Hubspot_Esign") {
          setCus_id(data.customer_id);
          const shortenLink = data.shorten_link[0].url;
          setLink(shortenLink);
          // Set user info and session data
          setUserInfo({
            number: data.recipient_mobile,
            email: sessionStorage.getItem("stepper_email"),
            cus_id: data.customer_id,
            action: data.action,
            otp_source: data.msg_service,
          });
        } else {
          setCus_id(data.customer_id);
          const shortenLink = data.shorten_link[0].url;
          setLink(shortenLink);
          setUserInfo({
            number: data.recipient_mobile,
            email: data.recipient_email,
            cus_id: data.customer_id,
            action: data.action,
            otp_source: data.msg_service,
          });
        }

        sessionStorage.setItem("uid", data.uid);
        sessionStorage.setItem("action", data.action);
        sessionStorage.setItem("source", data.msg_service);

        setUiState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error("Initialization error:", error);
        navigate(`/result/error/${tempName}Result`);
      }
    };

    if (uid) {
      initializeData();
    }
  }, [uid, tempName, navigate]);

  // Auto-fill OTP from WebOTP API or postMessage
  useEffect(() => {
    const handleWebOTP = async () => {
      try {
        if (
          navigator.credentials &&
          typeof navigator.credentials.get === "function"
        ) {
          const credential = await navigator.credentials.get({
            otp: { transport: ["sms"] },
          });
          if (credential?.type === "otp") {
            setVerificationCode(credential.code);
          }
        }
      } catch (error) {
        console.error("WebOTP error:", error);
      }
    };

    const handlePostMessage = (e) => {
      const otpData = e.data;
      if (otpData?.data && /^\d{6}$/.test(otpData.data)) {
        setVerificationCode(otpData.data);
      }
    };

    if (uiState.otpSent) {
      handleWebOTP();
      window.addEventListener("message", handlePostMessage);
    }

    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, [uiState.otpSent]);

  // Utility functions
  const showNotification = (message, variant = "info") => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: { vertical: "bottom", horizontal: "right" },
    });
  };

  const buildOtpPayload = (isVerification = false) => {
    const { number, email, cus_id, otp_source } = userInfo;
    const basePayload = { customer_id: cus_id, source: otp_source };

    if (otp_source?.includes("sms")) {
      basePayload.mobileNumber = number;
    }
    if (otp_source?.includes("email")) {
      basePayload.email = email;
    }
    if (isVerification) {
      basePayload.verificationCode = verificationCode;
    }

    return basePayload;
  };

  const formatContactInfo = () => {
    const { number, email, otp_source } = userInfo;
    let info = "";

    if (otp_source?.includes("sms")) {
      const maskedNumber =
        number.replace(/\D/g, "").slice(0, -2).replace(/\d/g, "*") +
        number.replace(/\D/g, "").slice(-2);
      info += `mobile phone +91 ${maskedNumber}`;
    }

    if (otp_source?.includes("sms") && otp_source?.includes("email")) {
      info += " and ";
    }

    if (otp_source?.includes("email")) {
      const maskedEmail =
        email.slice(0, 3) +
        email.slice(3, email.indexOf("@")).replace(/\S/g, "*") +
        email.slice(email.indexOf("@"));
      info += `Email ${maskedEmail}`;
    }

    return info;
  };

  // API functions
  const sendOTP = async () => {
    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      const payload = buildOtpPayload();

      const response = await axios.post(`${BASE_URL}/send_otp`, payload);

      showNotification(response.data.message, "success");
      setUiState((prev) => ({
        ...prev,
        otpSent: true,
        showVerification: true,
        showResend: true,
        isLoading: false,
      }));
      setTimer(15);
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to send OTP";
      showNotification(errorMessage, "error");
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const verifyOTP = async () => {
    if (verificationCode.length !== 6) {
      setUiState((prev) => ({ ...prev, inputTouched: true }));
      return;
    }

    try {
      setUiState((prev) => ({ ...prev, isLoading: true }));
      const payload = buildOtpPayload(true);

      await axios.post(`${BASE_URL}/verify_otp`, payload);

      // Success - authenticate and navigate
      setAuthentication(true);
      sessionStorage.setItem("auth", "true");
      navigate(`/messagedetail/${userInfo.action}/${tempName}/${uid}`);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Verification failed. Please try again.";
      setError({ message: errorMessage, showModal: true });
      setUiState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleResend = () => {
    if (resendCount < 1) {
      setResendCount((prev) => prev + 1);
      setUiState((prev) => ({
        ...prev,
        inputTouched: false,
        showResend: true,
      }));
      setVerificationCode("");
      sendOTP();
    }
  };

  // Event handlers
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    if (/^\d{0,6}$/.test(inputValue)) {
      setVerificationCode(inputValue);
    }
  };

  const handleCloseErrorModal = () => {
    setError({ message: null, showModal: false });
  };

  // Render loading state
  if (uiState.isLoading && !userInfo.otp_source) {
    return (
      <div
        id="Otp_Main"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <div id="Otp_Main">
      {stepper_email === "null" && action !== "Ajm_Insurance_Esign" ? (
        <Grid container>
          <Grid item xs={12} sm={2} lg={3}></Grid>

          <Grid
            item
            xs={12}
            sm={8}
            lg={6}
            className="Otp_Sub1"
            sx={{
              marginTop: "10px",
              marginLeft: { xs: "10px" },
              marginRight: { xs: "10px" },
            }}
          >
            <Paper
              elevation={2}
              bgcolor="white"
              sx={{
                width: "100%",
                maxWidth: "600px",
                textAlign: "center",
                borderRadius: "10px",
                height: "97vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Grid sx={{ padding: "20px" }}>
                <Grid container justifyContent="center">
                  <ImageDistributor
                    uid={cus_id}
                    logo={"Main_Logo"}
                    width={"50%"}
                    height={"auto"}
                  />
                </Grid>
              </Grid>
              <Grid sx={{ padding: "20px" }}>
                <Grid container>
                  <Grid item xs={12} sm={1}></Grid>
                  <Grid item xs={12} sm={10}>
                    <Box
                      sx={{
                        border: `1px solid ${
                          otpPageBranding
                            ? otpPageBranding.styles.box_border.color
                            : ""
                        }`,
                        borderRadius: "3px",
                      }}
                    >
                      <Grid sx={{ padding: "10px" }}>
                        <Typography sx={{ fontWeight: "600" }}>
                          Oops, looks like you have lost the link.{" "}
                          <a
                            href={link}
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none", color: "green" }}
                          >
                            Click here
                          </a>{" "}
                          and try again.
                        </Typography>
                      </Grid>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={1}></Grid>
                </Grid>
              </Grid>

              <Grid sx={{ paddingBottom: "20px", marginTop: "10px" }}>
                <Footer />
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={2} lg={3}></Grid>
        </Grid>
      ) : (
        <Grid container>
          <Grid item xs={12} sm={2} lg={3}></Grid>

          <Grid
            item
            xs={12}
            sm={8}
            lg={6}
            className="Otp_Sub1"
            sx={{
              marginTop: "10px",
              marginLeft: { xs: "10px" },
              marginRight: { xs: "10px" },
            }}
          >
            <Paper
              elevation={2}
              sx={{
                width: "100%",
                maxWidth: "600px",
                textAlign: "center",
                borderRadius: "10px",
                height: "97vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              {/* Logo Section */}
              <Grid sx={{ padding: "20px" }}>
                <Grid container justifyContent="center">
                  <ImageDistributor
                    uid={userInfo.cus_id}
                    logo={"Main_Logo"}
                    width={"50%"}
                    height={"auto"}
                  />
                </Grid>
              </Grid>

              {/* Main Content Section */}
              <Grid sx={{ padding: "20px" }}>
                <Grid container>
                  <Grid item xs={12} sm={1}></Grid>
                  <Grid item xs={12} sm={10}>
                    <Box
                      sx={{
                        border: `1px solid ${
                          otpPageBranding?.styles?.box_border?.color || "#ddd"
                        }`,
                        borderRadius: "3px",
                      }}
                    >
                      <Grid sx={{ padding: "10px" }}>
                        {!uiState.otpSent ? (
                          // Initial state - Show Get OTP button
                          <>
                            <Typography
                              variant="h6"
                              sx={{
                                textAlign: "center",
                                color:
                                  otpPageBranding?.styles?.heading?.color ||
                                  "inherit",
                                mb: 2,
                              }}
                            >
                              Verification Required
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  otpPageBranding?.styles?.description?.color ||
                                  "inherit",
                                mb: 3,
                              }}
                            >
                              Click the button below to receive a verification
                              code on your{" "}
                              <strong>{formatContactInfo()}</strong>
                            </Typography>
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={sendOTP}
                              disabled={uiState.isLoading}
                              sx={{
                                background:
                                  otpPageBranding?.styles?.button_color
                                    ?.color || "#warning.main",
                                "&:hover": {
                                  background: "#29351E",
                                },
                              }}
                            >
                              {uiState.isLoading ? (
                                <CircularProgress size={24} />
                              ) : (
                                "Get OTP"
                              )}
                            </Button>
                          </>
                        ) : (
                          // OTP sent state - Show verification input
                          <>
                            <Typography
                              variant="h6"
                              sx={{
                                textAlign: "center",
                                color:
                                  otpPageBranding?.styles?.heading?.color ||
                                  "inherit",
                              }}
                            >
                              Enter Verification Code
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  otpPageBranding?.styles?.description?.color ||
                                  "inherit",
                                mb: 2,
                              }}
                            >
                              Enter the code we just sent on your{" "}
                              <strong>{formatContactInfo()}</strong>
                            </Typography>

                            <TextField
                              type="text"
                              label="Verification Code"
                              variant="outlined"
                              fullWidth
                              value={verificationCode}
                              onChange={handleInputChange}
                              inputRef={verificationInputRef}
                              error={
                                uiState.inputTouched &&
                                verificationCode.length !== 6
                              }
                              helperText={
                                uiState.inputTouched &&
                                verificationCode.length !== 6
                                  ? "Please enter a 6-digit verification code"
                                  : ""
                              }
                              sx={{ mb: 2 }}
                            />

                            <Button
                              variant="contained"
                              fullWidth
                              onClick={verifyOTP}
                              disabled={uiState.isLoading}
                              sx={{
                                background:
                                  otpPageBranding?.styles?.button_color
                                    ?.color || "#warning.main",
                                "&:hover": {
                                  background: "#29351E",
                                },
                              }}
                            >
                              {uiState.isLoading ? (
                                <CircularProgress size={24} />
                              ) : (
                                "Verify"
                              )}
                            </Button>

                            {/* Timer and Resend */}
                            {uiState.showResend && timer > 0 && (
                              <Typography
                                variant="body2"
                                sx={{ textAlign: "center", mt: 2 }}
                              >
                                Wait for {timer} seconds
                              </Typography>
                            )}

                            {!uiState.showResend && resendCount < 1 && (
                              <Typography
                                variant="body2"
                                sx={{ textAlign: "center", mt: 2 }}
                              >
                                Don't receive the code?{" "}
                                <span
                                  onClick={handleResend}
                                  style={{
                                    color: "#29351E",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                  }}
                                >
                                  Resend
                                </span>
                              </Typography>
                            )}
                          </>
                        )}
                      </Grid>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={1}></Grid>
                </Grid>
              </Grid>

              {/* Footer Section */}
              <Grid sx={{ paddingBottom: "20px", marginTop: "10px" }}>
                <Footer />
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={2} lg={3}></Grid>
        </Grid>
      )}

      {/* Error Modal */}
      <Modal
        open={error.showModal}
        onClose={handleCloseErrorModal}
        aria-labelledby="error-modal-title"
        aria-describedby="error-modal-description"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: isSmallScreen ? "90%" : 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "10px",
          }}
        >
          <Typography id="error-modal-description" sx={{ mb: 2 }}>
            {error.message}
          </Typography>
          <div style={{ textAlign: "center" }}>
            <Button onClick={handleCloseErrorModal}>Close</Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};

export default Otp;
