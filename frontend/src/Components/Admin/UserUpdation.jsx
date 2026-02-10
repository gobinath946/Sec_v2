import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useSnackbar } from "notistack";
import logo from "../../Assets/Images/Securegateway-Gradient.png";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { apiEndPoint } from "../../Service/ApiConstant";
import Controller from "../../Service/ApiController";

const UserForm = ({ onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [showToken, setShowToken] = useState(false);
  const [confirmshowToken, setconfirmShowToken] = useState(false);
  const user_uid = sessionStorage.getItem("userUid");

  const fetchData = async () => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.USER_ROLE_FETCHER + user_uid,
        "GET"
      );
      if (result.success === true) {
        setValues(result.data);
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
      console.error("Super Admin User", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validateForm()) {
      try {
        const result = await Controller.ApiController(
          values,
          apiEndPoint.USER_ROLE_FETCHER + user_uid,
          "PUT"
        );
        if (result.success === true) {
          fetchData();
          enqueueSnackbar(`User Updated SuccessFully`, {
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
        console.error("Super Admin User", error);
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    for (const key in values) {
      const error = validateField(key, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    }
    if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const validateField = (fieldName, value) => {
    let error = "";
    switch (fieldName) {
      case "email_id":
        error = !value
          ? "Email ID is Required"
          : !/\S+@\S+\.\S+/.test(value)
          ? "Invalid email address"
          : "";
        break;
      case "user_name":
        error = !value ? "User Name is Required" : "";
        break;
      case "mobile_number":
        error = !value
          ? "Mobile Number is Required"
          : !/^\d{10}$/.test(value)
          ? "Invalid mobile number"
          : "";
        break;
      case "company_name":
        error = !value ? "Company Name is Required" : "";
        break;
      case "password":
        error =
          value &&
          !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}/.test(value)
            ? "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
            : "";
        break;
      case "confirmPassword":
        error = values.password !== value ? "Passwords do not match" : "";
        break;
      default:
        break;
    }
    return error;
  };

  const ClicksendTokenVisibility = () => {
    setShowToken((prevShowToken) => !prevShowToken);
  };
  const ClicksendConfirmTokenVisibility = () => {
    setconfirmShowToken((prevShowToken) => !prevShowToken);
  };

  return (
    <>
      <Grid
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <img
          src={logo}
          alt="icon"
          className="profile"
          style={{ height: "100px" }}
        />
      </Grid>
      <Grid style={{ padding: 5, marginTop: "10px" }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                name="email_id"
                value={values.email_id || ""}
                onChange={handleChange}
                error={!!errors.email_id}
                helperText={errors.email_id}
                disabled
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="User Name"
                name="user_name"
                value={values.user_name || ""}
                onChange={handleChange}
                error={!!errors.user_name}
                helperText={errors.user_name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Mobile Number"
                name="mobile_number"
                value={values.mobile_number || ""}
                onChange={handleChange}
                error={!!errors.mobile_number}
                helperText={errors.mobile_number}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Company Name"
                name="company_name"
                value={values.company_name || ""}
                onChange={handleChange}
                error={!!errors.company_name}
                helperText={errors.company_name}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6">Reset Password</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showToken ? "text" : "password"}
                name="password"
                value={values.password || ""}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Confirm Password"
                type={confirmshowToken ? "text" : "password"}
                name="confirmPassword"
                value={values.confirmPassword || ""}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={ClicksendConfirmTokenVisibility}>
                        {confirmshowToken ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
              }}
            >
              <Button type="submit" variant="contained" color="primary">
                Save
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={onClose}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </form>
      </Grid>
    </>
  );
};

export default UserForm;
