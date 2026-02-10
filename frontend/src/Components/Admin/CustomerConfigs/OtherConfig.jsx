import React, { useState, useEffect } from "react";
import { TextField, Button, Grid } from "@mui/material";
import { useSnackbar } from "notistack";

import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";

const OtherConfig = ({ data, uid, onDataUpdate }) => {
  const [signature, setSignature] = useState("");
  const [endpointtoken, setEndpointToken] = useState("");
  const [error, setError] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (data) {
      setSignature(data.applnx_signature || "");
      setEndpointToken(data.token || "");
    }
  }, [data]);

  const validateSignature = (value) => {
    if (!value.trim()) {
      return "Signature is required";
    } else if (value.length > 20) {
      return "Signature should not exceed 20 characters";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "signature") {
      const validationError = validateSignature(value);
      setError(validationError);
      setSignature(value);
    } else if (name === "endpointtoken") {
      setEndpointToken(value);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateSignature(signature);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      const result = await Controller.ApiController(
        {
          section: "otherConfig",
          uid: uid,
          data: {
            applnx_signature: signature,
            endpointtoken: endpointtoken,
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
      console.error("Other Config", error);
    }
  };

  const isSubmitDisabled = !signature;

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Applnx Signature"
            variant="outlined"
            fullWidth
            name="signature"
            value={signature}
            onChange={handleChange}
            error={Boolean(error)}
            helperText={error}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Endpoint Token"
            variant="outlined"
            fullWidth
            name="endpointtoken"
            value={endpointtoken}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {isSubmitDisabled ? "Submit" : "Update"}
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default OtherConfig;
