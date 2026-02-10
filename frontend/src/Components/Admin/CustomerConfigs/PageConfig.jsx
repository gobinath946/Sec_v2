import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  MenuItem,
  Modal,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { URL } from "../../../config";

import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";

const PageConfig = ({ data, uid, onDataUpdate }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const role = sessionStorage.getItem("Role");

  // Define actions and fields here
  const actions = [
    "Distribution",
    "Email_Template",
    "Quote",
    "Closure",
    "Confirmation",
    "Doc_Merger",
    "Doc_Distribution",
    "Link_Creator",
    "Msg_Distribution",
    "Sbho_Link",
    "Direct_Link",
  ];

  const fields = [
    "template",
    "url",
    "SMS_Content",
    "EMAIL_Content",
    "EMAIL_Subject",
  ];

  useEffect(() => {
    if (data) {
      const initialFormData = {};
      data.forEach((config) => {
        initialFormData[config.action] = config;
      });
      setFormData(initialFormData);
    }
  }, [data]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasErrors = Object.values(errors).some((actionErrors) =>
      Object.values(actionErrors).some((errorMessage) => !!errorMessage)
    );

    if (hasErrors) {
      console.error(errors);
      return;
    }

    try {
      const updatedPageConfigurations = Object.keys(formData).map((action) => {
        const config = formData[action];
        const { _id, ...rest } = config;
        const filteredRest = Object.fromEntries(
          Object.entries(rest).filter(
            ([key, value]) =>
              value !== undefined && value !== null && value !== ""
          )
        );
        return {
          _id: config._id || undefined,
          action,
          ...filteredRest,
        };
      });

      const result = await Controller.ApiController(
        {
          section: "pageConfig",
          uid,
          data: {
            payload: updatedPageConfigurations,
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
      console.error("Page Config", error);
    }
  };

  const handleChange = (action, field, value) => {
    const isRequired = value.trim() === "";
    let errorMessage = isRequired
      ? `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      : null;

    setFormData((prevState) => ({
      ...prevState,
      [action]: {
        ...prevState[action],
        [field]: value,
      },
    }));
    if (errorMessage !== null) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [action]: {
          ...prevErrors[action],
          [field]: errorMessage,
        },
      }));
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [action]: {
          ...prevErrors[action],
          [field]: "",
        },
      }));
    }
  };

  const handleAddConfig = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleActionChange = (event) => {
    const selectedAction = event.target.value;
    setSelectedAction(selectedAction);
    const defaultUrl = URL;
    setFormData((prevState) => ({
      ...prevState,
      [selectedAction]: {
        ...prevState[selectedAction],
        url: defaultUrl,
      },
    }));
  };

  return (
    <div>
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: 20,
            width: isSmallScreen ? "80%" : "30%",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <div>
            <Typography
              variant="h6"
              sx={{
                fontSize: "16px",
                marginBottom: "15px",
                marginTop: "15px",
                textAlign: "center",
              }}
            >
              Add Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <TextField
                  select
                  label="Action"
                  value={selectedAction}
                  onChange={handleActionChange}
                  variant="outlined"
                  fullWidth
                  size="small"
                >
                  {actions.map((action, index) => (
                    <MenuItem key={index} value={action}>
                      {action}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {selectedAction &&
                fields.map((field, index) => (
                  <Grid item xs={12} sm={12} key={index}>
                    <TextField
                      label={
                        field.charAt(0).toUpperCase() +
                        field.slice(1).replace("_", " ")
                      }
                      variant="outlined"
                      fullWidth
                      size="small"
                      onChange={(e) =>
                        handleChange(selectedAction, field, e.target.value)
                      }
                      value={formData[selectedAction]?.[field] || ""}
                      error={!!errors[selectedAction]?.[field]}
                      helperText={errors[selectedAction]?.[field]}
                    />
                  </Grid>
                ))}
            </Grid>
            <Grid sx={{ marginTop: "20px", textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCloseModal}
              >
                Save
              </Button>
            </Grid>
          </div>
        </Paper>
      </Modal>

      {/* Form for existing configurations */}
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((action) => (
          <div key={action}>
            <Typography
              variant="h6"
              sx={{
                fontSize: "16px",
                marginBottom: "15px",
                marginTop: "15px",
              }}
            >
              {action}
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(formData[action])
                .filter((field) => field !== "action")
                .map((field, index) => {
                  if (!(role === "admin" && field === "url")) {
                    return (
                      <Grid item xs={12} sm={4} key={index}>
                        <TextField
                          name={`${action}_${field}`}
                          label={
                            field.charAt(0).toUpperCase() +
                            field.slice(1).replace("_", " ")
                          }
                          variant="outlined"
                          fullWidth
                          size="small"
                          onChange={(e) =>
                            handleChange(action, field, e.target.value)
                          }
                          value={formData[action][field]}
                          error={!!errors[action]?.[field]}
                          helperText={errors[action]?.[field]}
                        />
                      </Grid>
                    );
                  }
                  return null;
                })}
            </Grid>
          </div>
        ))}
        <Grid
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <Grid>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              sx={{ marginTop: "10px" }}
            >
              Update
            </Button>
          </Grid>
          {role === "superadmin" && (
            <Grid>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddConfig}
                sx={{ marginTop: "10px" }}
              >
                Add Configuration
              </Button>
            </Grid>
          )}
        </Grid>
      </form>
    </div>
  );
};

export default PageConfig;
