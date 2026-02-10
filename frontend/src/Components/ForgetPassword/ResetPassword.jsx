import React, { useState } from "react";
import axios from "axios";
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Button,
  Typography,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Modal,
  Box,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { BASE_URL } from "../../config";
import { useNavigate } from "react-router-dom";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const ResetPassword = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const steps = [
    { label: "Enter Email", state: email, setState: setEmail, type: "email" },
    {
      label: "Verify OTP",
      state: otp,
      setState: setOtp,
      type: "number",
      maxLength: 6,
    },
    {
      label: "Set New Password",
      state: newPassword,
      setState: setNewPassword,
      type: "password",
    },
  ];

  const handleEmailSubmit = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/verify_email`, {
        email_id: email,
      });

      if (response.status === 200) {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } else {
        setEmailError(response.data.error);
      }
    } catch (error) {
      setEmailError(error.response.data.error);
    }
  };

  const handleOTPSubmit = async () => {
    if (!validateOTP(otp)) {
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/verify_pass`, {
        email_id: email,
        otp,
      });

      if (response.status === 200) {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      } else {
        setOtpError(response.data.error);
      }
    } catch (error) {
      setOtpError(error.response.data.error);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!validatePassword(newPassword, confirmPassword)) {
      return;
    }

    try {
      const response = await axios.put(`${BASE_URL}/update_password`, {
        email_id: email,
        newPassword,
      });

      if (response.status === 200) {
        setShowSuccessMessage(true);
      } else {
        setPasswordError(response.data.error);
      }
    } catch (error) {
      setPasswordError(error.response.data.error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
    navigate("/"); // Redirect to login page after closing modal
  };

  const validateEmail = (email) => {
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Invalid email format!");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateOTP = (otp) => {
    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits!");
      return false;
    }
    setOtpError("");
    return true;
  };

  const validatePassword = (password, confirmPassword) => {
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters!");
      return false;
    }
    const pattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!pattern.test(password)) {
      setPasswordError(
        "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return false;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match!");
      return false;
    }
    setPasswordError("");
    return true;
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h5" align="center" sx={{ mt: "40px" }} gutterBottom>
        Reset Password
      </Typography>
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{ mt: "100px" }}
      >
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={step.label}
                    type={
                      step.type === "password"
                        ? showPassword
                          ? "text"
                          : "password"
                        : step.type
                    }
                    value={step.state}
                    onChange={(e) => step.setState(e.target.value)}
                    inputProps={{ maxLength: step.maxLength }}
                    error={
                      index === 0 && emailError !== "" || 
                      index === 1 && otpError !== "" || 
                      index === 2 && passwordError !== ""
                    }
                    helperText={
                      index === 0 ? emailError :
                      index === 1 ? otpError :
                      index === 2 ? passwordError : ""
                    }
                    InputProps={{
                      endAdornment: step.type === "password" && (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                {index === 2 && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      helperText={confirmPassword !== newPassword && "Passwords do not match"}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button disabled={activeStep === 0} onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={
                      activeStep === 0
                        ? handleEmailSubmit
                        : activeStep === 1
                        ? handleOTPSubmit
                        : handlePasswordSubmit
                    }
                    disabled={
                      (step.label === "Enter Email" && !step.state) ||
                      (step.label === "Verify OTP" &&
                        step.state.length !== 6) ||
                      (step.label === "Set New Password" &&
                        step.state.length < 1)
                    }
                  >
                    {activeStep === steps.length - 1 ? "Submit" : "Next"}
                  </Button>
                </Grid>
              </Grid>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {/* Success Message Modal */}
      <Modal
        open={showSuccessMessage}
        onClose={handleCloseSuccessMessage}
        aria-labelledby="success-modal-title"
        aria-describedby="success-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxWidth: 400,
            textAlign: "center",
          }}
        >
          <Typography variant="body1" id="success-modal-description">
            Your new password has been set successfully.
          </Typography>
          <CheckCircleOutlineIcon sx={{ color: "Green", fontSize: "80px" }} />
          <Grid item xs={12}>
            <Button color="primary" onClick={handleCloseSuccessMessage}>
              Close
            </Button>
          </Grid>
        </Box>
      </Modal>
    </Container>
  );
};

export default ResetPassword;
