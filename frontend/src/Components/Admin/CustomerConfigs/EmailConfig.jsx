import React, { useState, useEffect } from "react";
import {
  Switch,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";

const EmailConfig = ({ data, uid, onDataUpdate }) => {
  const [gmailEnabled, setGmailEnabled] = useState(false);
  const [outlookEnabled, setOutlookEnabled] = useState(false);
  const [sendgridEnabled, setSendgridEnabled] = useState(false);
  const [gmailData, setGmailData] = useState({ email: "", password: "", from_name: "" });
  const [outlookData, setOutlookData] = useState({ email: "", password: "", from_name: "" });
  const [sendgridData, setSendgridData] = useState({ email: "", password: "", from_name: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [targetService, setTargetService] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showStopServiceModal, setShowStopServiceModal] = useState(false);
  const [errors, setErrors] = useState({
    gmailEmail: "",
    gmailPassword: "",
    gmailFromName: "",
    outlookEmail: "",
    outlookPassword: "",
    outlookFromName: "",
    sendgridEmail: "",
    sendgridPassword: "",
    sendgridFromName: "",
  });

  const { enqueueSnackbar } = useSnackbar();
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    if (Array.isArray(data)) {
      data.forEach((entry) => {
        if (entry.service_name === "Gmail") {
          setGmailData({ 
            email: entry.user_name, 
            password: entry.password,
            from_name: entry.from_name || ""
          });
          setGmailEnabled(true);
        } else if (entry.service_name === "Outlook") {
          setOutlookData({ 
            email: entry.user_name, 
            password: entry.password,
            from_name: entry.from_name || ""
          });
          setOutlookEnabled(true);
        } else if (entry.service_name === "SendGrid") {
          setSendgridData({ 
            email: entry.user_name, 
            password: entry.password,
            from_name: entry.from_name || ""
          });
          setSendgridEnabled(true);
        }
      });
    }
  }, [data]);

  const handleGmailToggle = () => {
    if (outlookEnabled || sendgridEnabled) {
      setTargetService("Gmail");
      setModalOpen(true);
    } else {
      setGmailEnabled(!gmailEnabled);
    }
  };

  const handleOutlookToggle = () => {
    if (gmailEnabled || sendgridEnabled) {
      setTargetService("Outlook");
      setModalOpen(true);
    } else {
      setOutlookEnabled(!outlookEnabled);
    }
  };

  const handleSendgridToggle = () => {
    if (gmailEnabled || outlookEnabled) {
      setTargetService("SendGrid");
      setModalOpen(true);
    } else {
      setSendgridEnabled(!sendgridEnabled);
    }
  };

  const handleYesClick = () => {
    if (targetService === "Gmail") {
      setOutlookEnabled(false);
      setSendgridEnabled(false);
      setGmailEnabled(true);
    } else if (targetService === "Outlook") {
      setGmailEnabled(false);
      setSendgridEnabled(false);
      setOutlookEnabled(true);
    } else if (targetService === "SendGrid") {
      setGmailEnabled(false);
      setOutlookEnabled(false);
      setSendgridEnabled(true);
    }
    setModalOpen(false);
  };

  const handleNoClick = () => {
    setModalOpen(false);
  };

  const handleGmailInputChange = (event) => {
    const { name, value } = event.target;
    setGmailData({ ...gmailData, [name]: value });
    validateField("gmail", name, value);
  };

  const handleOutlookInputChange = (event) => {
    const { name, value } = event.target;
    setOutlookData({ ...outlookData, [name]: value });
    validateField("outlook", name, value);
  };

  const handleSendgridInputChange = (event) => {
    const { name, value } = event.target;
    setSendgridData({ ...sendgridData, [name]: value });
    validateField("sendgrid", name, value);
  };

  const handleSubmit = async () => {
    if (!formValid) {
      return;
    }
    let emailConfigData = [];
    if (gmailEnabled) {
      emailConfigData.push({
        service_name: "Gmail",
        user_name: gmailData.email,
        password: gmailData.password,
        from_name: gmailData.from_name,
      });
    }
    if (outlookEnabled) {
      emailConfigData.push({
        service_name: "Outlook",
        user_name: outlookData.email,
        password: outlookData.password,
        from_name: outlookData.from_name,
      });
    }
    if (sendgridEnabled) {
      emailConfigData.push({
        service_name: "SendGrid",
        user_name: sendgridData.email,
        password: sendgridData.password,
        from_name: sendgridData.from_name,
      });
    }

    try {
      const result = await Controller.ApiController(
        {
          section: "emailConfig",
          uid: uid,
          data: {
            email_configuration: emailConfigData,
          },
        },
        apiEndPoint.CUSTOMER_DATA + uid,
        "PUT"
      );
      onDataUpdate();
      if (result.success === true) {
        enqueueSnackbar(`${result.data.data}`, {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      } else {
        enqueueSnackbar(`${result.data}`, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      console.error("Email Config", error);
    }
  };

  const GmailPasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const validateField = (service, name, value) => {
    const errorKey = `${service}${name.charAt(0).toUpperCase() + name.slice(1)}`;
    
    switch (name) {
      case "email":
        if (!value.trim()) {
          setErrors({ ...errors, [errorKey]: "Email is required" });
        } else if (!/^\S+@\S+\.\S+$/.test(value)) {
          setErrors({ ...errors, [errorKey]: "Invalid email format" });
        } else {
          setErrors({ ...errors, [errorKey]: "" });
        }
        break;
      case "password":
        if (!value.trim()) {
          setErrors({ ...errors, [errorKey]: "Password is required" });
        } else if (value.length > 50) {
          setErrors({
            ...errors,
            [errorKey]: "Password should not exceed 50 characters",
          });
        } else {
          setErrors({ ...errors, [errorKey]: "" });
        }
        break;
      case "from_name":
        if (!value.trim()) {
          setErrors({ ...errors, [errorKey]: "From name is required" });
        } else if (value.length > 100) {
          setErrors({
            ...errors,
            [errorKey]: "From name should not exceed 100 characters",
          });
        } else {
          setErrors({ ...errors, [errorKey]: "" });
        }
        break;
      default:
        break;
    }
    
    // Check if form is valid after updating errors
    setTimeout(() => {
      const isValid = Object.values(errors).every((e) => !e);
      setFormValid(isValid);
    }, 0);
  };

  const handleUpdateButtonClick = () => {
    setShowStopServiceModal(true);
  };

  const handleStopServiceNoClick = () => {
    setShowStopServiceModal(false);
  };

  const handleStopServiceYesClick = async () => {
    setShowStopServiceModal(false);

    try {
      const result = await Controller.ApiController(
        {
          section: "emailConfig",
          uid: uid,
          data: {
            email_configuration: [],
          },
        },
        apiEndPoint.CUSTOMER_DATA + uid,
        "PUT"
      );
      onDataUpdate();
      if (result.success === true) {
        enqueueSnackbar(`${result.data.data}`, {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      } else {
        enqueueSnackbar(`${result.data}`, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      console.error("Email Config", error);
    }
  };

  return (
    <Grid>
      <Grid>
        <Switch
          checked={gmailEnabled}
          onChange={handleGmailToggle}
          inputProps={{ "aria-label": "Enable Gmail" }}
        />
        Gmail
        {gmailEnabled && (
          <>
            <Grid container spacing={2} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Email Account"
                  name="email"
                  value={gmailData.email}
                  onChange={handleGmailInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.gmailEmail)}
                  helperText={errors.gmailEmail}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  type={showPassword ? "text" : "password"}
                  label="Gmail Password"
                  name="password"
                  value={gmailData.password}
                  onChange={handleGmailInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.gmailPassword)}
                  helperText={errors.gmailPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={GmailPasswordVisibility}>
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="From Name"
                  name="from_name"
                  value={gmailData.from_name}
                  onChange={handleGmailInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.gmailFrom_name)}
                  helperText={errors.gmailFrom_name}
                  placeholder="e.g., John Doe"
                />
              </Grid>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ marginTop: "10px" }}>
              <Button variant="contained" onClick={handleSubmit}>
                Save
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      <Grid style={{ marginTop: "10px" }}>
        <Switch
          checked={outlookEnabled}
          onChange={handleOutlookToggle}
          inputProps={{ "aria-label": "Enable Outlook" }}
        />
        Enable Outlook
        {outlookEnabled && (
          <>
            <Grid container spacing={2} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Outlook Account"
                  name="email"
                  value={outlookData.email}
                  onChange={handleOutlookInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.outlookEmail)}
                  helperText={errors.outlookEmail}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  type={showPassword ? "text" : "password"}
                  label="Outlook Password"
                  name="password"
                  value={outlookData.password}
                  onChange={handleOutlookInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.outlookPassword)}
                  helperText={errors.outlookPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={GmailPasswordVisibility}>
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="From Name"
                  name="from_name"
                  value={outlookData.from_name}
                  onChange={handleOutlookInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.outlookFrom_name)}
                  helperText={errors.outlookFrom_name}
                  placeholder="e.g., John Doe"
                />
              </Grid>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ marginTop: "10px" }}>
              <Button variant="contained" onClick={handleSubmit}>
                Save
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      <Grid style={{ marginTop: "10px" }}>
        <Switch
          checked={sendgridEnabled}
          onChange={handleSendgridToggle}
          inputProps={{ "aria-label": "Enable SendGrid" }}
        />
        Enable SendGrid
        {sendgridEnabled && (
          <>
            <Grid container spacing={2} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Sendgrid Account"
                  name="email"
                  value={sendgridData.email}
                  onChange={handleSendgridInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.sendgridEmail)}
                  helperText={errors.sendgridEmail}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  type={showPassword ? "text" : "password"}
                  label="Sendgrid Password"
                  name="password"
                  value={sendgridData.password}
                  onChange={handleSendgridInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.sendgridPassword)}
                  helperText={errors.sendgridPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={GmailPasswordVisibility}>
                          {showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="From Name"
                  name="from_name"
                  value={sendgridData.from_name}
                  onChange={handleSendgridInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.sendgridFrom_name)}
                  helperText={errors.sendgridFrom_name}
                  placeholder="e.g., John Doe"
                />
              </Grid>
            </Grid>
            <Grid item xs={12} sm={4} sx={{ marginTop: "10px" }}>
              <Button variant="contained" onClick={handleSubmit}>
                Save
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      {!gmailEnabled && !outlookEnabled && !sendgridEnabled && (
        <Grid item xs={12} sm={4} sx={{ marginTop: "10px" }}>
          <Button variant="contained" onClick={handleUpdateButtonClick}>
            Update
          </Button>
        </Grid>
      )}

      <Dialog open={modalOpen} onClose={handleNoClick}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          Only one service can be enabled at a time. Enabling the current
          service will delete the previous service data. Are you sure you want
          to proceed?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleYesClick}>Yes</Button>
          <Button onClick={handleNoClick}>No</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showStopServiceModal} onClose={handleStopServiceNoClick}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          Are you sure you want to stop the services?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStopServiceYesClick}>Yes</Button>
          <Button onClick={handleStopServiceNoClick}>No</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default EmailConfig;