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
  Select,
  MenuItem,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";
import * as Lib from "../../../constant";

const SmsConfig = ({ data, uid, onDataUpdate }) => {
  const [clicksendEnabled, setClicksendEnabled] = useState(false);
  const [clicksendData, setClicksendData] = useState({
    user_name: "",
    token: "",
    sender_id: "",
    country_code: "+91",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [targetService, setTargetService] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [selectedOption, setSelectedOption] = useState("number");
  const [showStopServiceModal, setShowStopServiceModal] = useState(false);
  const [errors, setErrors] = useState({
    clicksendUserName: "",
    clicksendToken: "",
    clicksenderID: "",
  });

  const { enqueueSnackbar } = useSnackbar();
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    if (Array.isArray(data)) {
      data.forEach((entry) => {
        if (entry.service_name === "Clicksend") {
          let senderIdWithoutCountryCode = entry.sender_id.replace(
            entry.country_code,
            ""
          );
          setClicksendData({
            user_name: entry.user_name,
            token: entry.token,
            sender_id: senderIdWithoutCountryCode,
            country_code: entry.country_code || "+91",
          });
          setSelectedOption(entry.selected_option);
          setClicksendEnabled(true);
        }
      });
    }
  }, [data]);

  const handleClicksendToggle = () => {
    setClicksendEnabled(!clicksendEnabled);
  };

  const handleYesClick = () => {
    if (targetService === "Clicksend") {
      setClicksendEnabled(true);
    }
    setModalOpen(false);
  };

  const handleNoClick = () => {
    setModalOpen(false);
  };

  const handleClicksendInputChange = (event) => {
    const { name, value } = event.target;
    const updatedData = {
      ...clicksendData,
      [name]: value,
    };
    setClicksendData(updatedData);
    validateField(name, value);
  };

  const handleSubmit = async () => {
    if (!formValid) {
      return;
    }
    let smsConfigData = [];
    if (clicksendEnabled) {
      smsConfigData.push({
        service_name: "Clicksend",
        user_name: clicksendData.user_name,
        token: clicksendData.token,
        sender_id: clicksendData.sender_id,
        country_code: clicksendData.country_code,
        selected_option: selectedOption,
      });
    }

    try {
      const result = await Controller.ApiController(
        {
          section: "smsConfig",
          uid: uid,
          data: {
            sms_configuration: smsConfigData,
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
      console.error("Sms Config", error);
    }
  };

  const ClicksendTokenVisibility = () => {
    setShowToken((prevShowToken) => !prevShowToken);
  };

  const validateField = (name, value) => {
    switch (name) {
      case "user_name":
        if (!value.trim()) {
          setErrors({ ...errors, clicksendUserName: "UserName is required" });
        }
        if (value.length > 50) {
          setErrors({
            ...errors,
            clicksendUserName: "UserName should not exceed 50 characters",
          });
        } else {
          setErrors({ ...errors, clicksendUserName: "" });
        }
        break;
      case "sender_id":
        if (!value.trim()) {
          setErrors({ ...errors, clicksenderID: "SenderID is required" });
        }
        if (value.length > 50) {
          setErrors({
            ...errors,
            clicksenderID: "SenderID should not exceed 50 characters",
          });
        } else {
          setErrors({ ...errors, clicksenderID: "" });
        }
        break;
      case "token":
        if (value.length > 50) {
          setErrors({
            ...errors,
            clicksendToken: "Token should not exceed 50 characters",
          });
        } else {
          setErrors({ ...errors, clicksendToken: "" });
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
          section: "smsConfig",
          uid: uid,
          data: {
            sms_configuration: [],
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

  const handleOptionChange = (event) => {
    setClicksendData({
      ...clicksendData,
      sender_id: "",
    });
    setSelectedOption(event.target.value);
  };

  const countryCodes = Lib.countryCodes;

  return (
    <Grid>
      <Grid>
        <Switch
          checked={clicksendEnabled}
          onChange={handleClicksendToggle}
          inputProps={{ "aria-label": "Enable Clicksend" }}
        />
        Clicksend
        {clicksendEnabled && (
          <>
            <Grid container spacing={2} sx={{ marginTop: "10px" }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="User Name"
                  name="user_name"
                  value={clicksendData.user_name}
                  onChange={handleClicksendInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.clicksendUserName)}
                  helperText={errors.clicksendUserName}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  type={showToken ? "text" : "password"}
                  label="Clicksend Token"
                  name="token"
                  value={clicksendData.token}
                  onChange={handleClicksendInputChange}
                  fullWidth
                  size="small"
                  error={Boolean(errors.clicksendToken)}
                  helperText={errors.clicksendToken}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={ClicksendTokenVisibility}>
                          {showToken ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Select Sender Option"
                  value={selectedOption}
                  onChange={handleOptionChange}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="number">Mobile Number</MenuItem>
                  <MenuItem value="tags">Alpha Tags</MenuItem>
                </TextField>
              </Grid>
              {selectedOption === "number" && (
                <Grid item xs={12} sm={6} md={4}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item xs={4}>
                      <Select
                        size="small"
                        value={clicksendData.country_code}
                        onChange={(e) =>
                          setClicksendData({
                            ...clicksendData,
                            country_code: e.target.value,
                          })
                        }
                        displayEmpty
                        fullWidth
                      >
                        {countryCodes.map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            {country.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                    <Grid item xs={8}>
                      <TextField
                        label="Sender ID"
                        name="sender_id"
                        value={clicksendData.sender_id.replace(
                          clicksendData.country_code,
                          ""
                        )}
                        onChange={handleClicksendInputChange}
                        fullWidth
                        size="small"
                        error={Boolean(errors.clicksenderID)}
                        helperText={errors.clicksenderID}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              )}
              {selectedOption === "tags" && (
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Sender ID"
                    name="sender_id"
                    value={clicksendData.sender_id.replace(
                      clicksendData.country_code,
                      ""
                    )}
                    onChange={handleClicksendInputChange}
                    fullWidth
                    size="small"
                    error={Boolean(errors.clicksenderID)}
                    helperText={errors.clicksenderID}
                  />
                </Grid>
              )}
            </Grid>
            <Grid item xs={12} sm={4} sx={{ marginTop: "10px" }}>
              <Button variant="contained" onClick={handleSubmit}>
                Save
              </Button>
            </Grid>
          </>
        )}
      </Grid>

      {!clicksendEnabled && (
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

export default SmsConfig;
