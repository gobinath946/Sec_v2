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

import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";

const FileConfig = ({ data, uid, onDataUpdate }) => {
  const [s3Enabled, setS3Enabled] = useState(false);
  const [dropboxEnabled, setDropboxEnabled] = useState(false);
  const [googleDriveEnabled, setGoogleDriveEnabled] = useState(false);
  const [s3Data, setS3Data] = useState({
    access_key: "",
    bucket_name: "",
    file_link: "",
    region: "",
    secret_key: "",
  });
  const [dropboxData, setDropboxData] = useState({
    access_key: "",
    client_id: "",
    secret_id: "",
    refresh_token: "",
    auth_code: "",
  });
  const [googleDriveData, setGoogleDriveData] = useState({
    client_id: "",
    secret_id: "",
    redirect_uri: "",
    refresh_token: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [targetService, setTargetService] = useState(null);
  const [showStopServiceModal, setShowStopServiceModal] = useState(false);
  const [errors, setErrors] = useState({
    access_key: "",
    bucket_name: "",
    file_link: "",
    region: "",
    secret_key: "",
    client_id: "",
    secret_id: "",
    redirect_uri: "",
    refresh_token: "",
  });

  const { enqueueSnackbar } = useSnackbar();
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    if (Array.isArray(data)) {
      data.forEach((entry) => {
        if (entry.service_name === "S3") {
          setS3Data({
            access_key: entry.access_key,
            bucket_name: entry.bucket_name,
            file_link: entry.file_link,
            region: entry.region,
            secret_key: entry.secret_key,
          });
          setS3Enabled(true);
        } else if (entry.service_name === "Dropbox") {
          setDropboxData({
            access_key: entry.access_key,
            client_id: entry.client_id,
            secret_id: entry.secret_id,
            refresh_token: entry.refresh_token,
            auth_code: entry.auth_code,
          });
          setDropboxEnabled(true);
        } else if (entry.service_name === "GoogleDrive") {
          setGoogleDriveData({
            client_id: entry.client_id,
            secret_id: entry.secret_id,
            redirect_uri: entry.redirect_uri,
            refresh_token: entry.refresh_token,
          });
          setGoogleDriveEnabled(true);
        }
      });
    }
  }, [data]);

  const handleS3Toggle = () => {
    if (dropboxEnabled || googleDriveEnabled) {
      setTargetService("S3");
      setModalOpen(true);
    } else {
      setS3Enabled(!s3Enabled);
    }
  };

  const handleDropboxToggle = () => {
    if (s3Enabled || googleDriveEnabled) {
      setTargetService("Dropbox");
      setModalOpen(true);
    } else {
      setDropboxEnabled(!dropboxEnabled);
    }
  };

  const handleGoogleDriveToggle = () => {
    if (s3Enabled || dropboxEnabled) {
      setTargetService("GoogleDrive");
      setModalOpen(true);
    } else {
      setGoogleDriveEnabled(!googleDriveEnabled);
    }
  };

  const handleYesClick = () => {
    if (targetService === "S3") {
      setDropboxEnabled(false);
      setGoogleDriveEnabled(false);
      setS3Enabled(true);
    } else if (targetService === "Dropbox") {
      setS3Enabled(false);
      setGoogleDriveEnabled(false);
      setDropboxEnabled(true);
    } else if (targetService === "GoogleDrive") {
      setS3Enabled(false);
      setDropboxEnabled(false);
      setGoogleDriveEnabled(true);
    }
    setModalOpen(false);
  };

  const handleNoClick = () => {
    setModalOpen(false);
  };

  const handleS3InputChange = (event) => {
    const { name, value } = event.target;
    setS3Data({ ...s3Data, [name]: value });
    validateField(name, value);
  };

  const handleDropboxInputChange = (event) => {
    const { name, value } = event.target;
    setDropboxData({ ...dropboxData, [name]: value });
    validateField(name, value);
  };

  const handleGoogleDriveInputChange = (event) => {
    const { name, value } = event.target;
    setGoogleDriveData({ ...googleDriveData, [name]: value });
    validateField(name, value);
  };

  const handleSubmit = async () => {
    if (!formValid) {
      return;
    }
    let fileConfigData = [];
    if (s3Enabled) {
      fileConfigData.push({
        service_name: "S3",
        access_key: s3Data.access_key,
        bucket_name: s3Data.bucket_name,
        file_link: s3Data.file_link,
        region: s3Data.region,
        secret_key: s3Data.secret_key,
      });
    }
    if (dropboxEnabled) {
      fileConfigData.push({
        service_name: "Dropbox",
        access_key: dropboxData.access_key,
        client_id: dropboxData.client_id,
        secret_id: dropboxData.secret_id,
        refresh_token: dropboxData.refresh_token,
        auth_code: dropboxData.auth_code,
      });
    }
    if (googleDriveEnabled) {
      fileConfigData.push({
        service_name: "GoogleDrive",
        client_id: googleDriveData.client_id,
        secret_id: googleDriveData.secret_id,
        redirect_uri: googleDriveData.redirect_uri,
        refresh_token: googleDriveData.refresh_token,
      });
    }

    try {
      const result = await Controller.ApiController(
        {
          section: "fileConfig",
          uid: uid,
          data: {
            file_configuration: fileConfigData,
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
      console.error("File Config", error);
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case "access_key":
        if (!value.trim()) {
          setErrors({ ...errors, access_key: "Access Key is required" });
        } else {
          setErrors({ ...errors, access_key: "" });
        }
        break;
      case "bucket_name":
        if (!value.trim()) {
          setErrors({ ...errors, bucket_name: "Bucket Name is required" });
        } else {
          setErrors({ ...errors, bucket_name: "" });
        }
        break;
      case "file_link":
        if (!value.trim()) {
          setErrors({ ...errors, file_link: "File Link is required" });
        } else {
          setErrors({ ...errors, file_link: "" });
        }
        break;
      case "region":
        if (!value.trim()) {
          setErrors({ ...errors, region: "Region Link is required" });
        } else {
          setErrors({ ...errors, region: "" });
        }
        break;
      case "secret_key":
        if (!value.trim()) {
          setErrors({ ...errors, secret_key: "Secret Key Link is required" });
        } else {
          setErrors({ ...errors, secret_key: "" });
        }
        break;
      case "auth_code":
        if (!value.trim()) {
          setErrors({ ...errors, secret_key: "Auth Code is required" });
        } else {
          setErrors({ ...errors, secret_key: "" });
        }
        break;
      case "client_id":
        if (!value.trim()) {
          setErrors({ ...errors, client_id: "Client ID is required" });
        } else {
          setErrors({ ...errors, client_id: "" });
        }
        break;
      case "secret_id":
        if (!value.trim()) {
          setErrors({ ...errors, secret_id: "Secret ID is required" });
        } else {
          setErrors({ ...errors, secret_id: "" });
        }
        break;
      case "redirect_uri":
        if (!value.trim()) {
          setErrors({ ...errors, redirect_uri: "Redirect URI is required" });
        } else {
          setErrors({ ...errors, redirect_uri: "" });
        }
        break;
      case "refresh_token":
        if (!value.trim()) {
          setErrors({ ...errors, refresh_token: "Refresh Token is required" });
        } else {
          setErrors({ ...errors, refresh_token: "" });
        }
        break;
      default:
        break;
    }
    const isValid = Object.values(errors).every((e) => !e);
    setFormValid(isValid);
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
          section: "fileConfig",
          uid: uid,
          data: {
            file_configuration: [],
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

  const handleAuthCodeButtonClick = () => {
    if (!dropboxData.client_id) {
      enqueueSnackbar("Client ID is required", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }

    const authorizationUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${dropboxData.client_id}&response_type=code&token_access_type=offline`;

    window.open(authorizationUrl, "_blank");
  };

  return (
    <Grid>
      <Grid>
        <Switch
          checked={s3Enabled}
          onChange={handleS3Toggle}
          inputProps={{ "aria-label": "Enable S3" }}
        />
        S3
        {s3Enabled && (
          <>
            <Grid container spacing={2} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Access Key"
                  name="access_key"
                  value={s3Data.access_key}
                  onChange={handleS3InputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.access_key)}
                  helperText={errors.access_key}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Bucket Name"
                  name="bucket_name"
                  value={s3Data.bucket_name}
                  onChange={handleS3InputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.bucket_name)}
                  helperText={errors.bucket_name}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="File Link"
                  name="file_link"
                  value={s3Data.file_link}
                  onChange={handleS3InputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.file_link)}
                  helperText={errors.file_link}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Region"
                  name="region"
                  value={s3Data.region}
                  onChange={handleS3InputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.region)}
                  helperText={errors.region}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Secret Key"
                  name="secret_key"
                  value={s3Data.secret_key}
                  onChange={handleS3InputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.secret_key)}
                  helperText={errors.secret_key}
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
          checked={dropboxEnabled}
          onChange={handleDropboxToggle}
          inputProps={{ "aria-label": "Enable Dropbox" }}
        />
        Dropbox
        {dropboxEnabled && (
          <>
            <Grid container spacing={2} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Access Key"
                  name="access_key"
                  value={dropboxData.access_key}
                  onChange={handleDropboxInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.access_key)}
                  helperText={errors.access_key}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Client ID"
                  name="client_id"
                  value={dropboxData.client_id}
                  onChange={handleDropboxInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.client_id)}
                  helperText={errors.client_id}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Secret ID"
                  name="secret_id"
                  value={dropboxData.secret_id}
                  onChange={handleDropboxInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.secret_id)}
                  helperText={errors.secret_id}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Refresh Token"
                  name="refresh_token"
                  value={dropboxData.refresh_token}
                  onChange={handleDropboxInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.refresh_token)}
                  helperText={errors.refresh_token}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Auth Code"
                  name="auth_code"
                  value={dropboxData.auth_code}
                  onChange={handleDropboxInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.auth_code)}
                  helperText={errors.auth_code}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleAuthCodeButtonClick}
                          sx={{ fontSize: "15px", fontWeight: "bold" }}
                        >
                          Get Code
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
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
          checked={googleDriveEnabled}
          onChange={handleGoogleDriveToggle}
          inputProps={{ "aria-label": "Enable Google Drive" }}
        />
        Google Drive
        {googleDriveEnabled && (
          <>
            <Grid container spacing={2} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Client ID"
                  name="client_id"
                  value={googleDriveData.client_id}
                  onChange={handleGoogleDriveInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.client_id)}
                  helperText={errors.client_id}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Secret ID"
                  name="secret_id"
                  value={googleDriveData.secret_id}
                  onChange={handleGoogleDriveInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.secret_id)}
                  helperText={errors.secret_id}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Redirect ID"
                  name="redirect_uri"
                  value={googleDriveData.redirect_uri}
                  onChange={handleGoogleDriveInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.redirect_uri)}
                  helperText={errors.redirect_uri}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Refresh Token"
                  name="refresh_token"
                  value={googleDriveData.refresh_token}
                  onChange={handleGoogleDriveInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.refresh_token)}
                  helperText={errors.refresh_token}
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

      {!s3Enabled && !dropboxEnabled && !googleDriveEnabled && (
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

export default FileConfig;
