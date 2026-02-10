import React, { useState, useEffect } from "react";
import { TextField, Button, Grid } from "@mui/material";
import { useSnackbar } from "notistack";

import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";

const OtpConfig = ({ data, uid, onDataUpdate }) => {
  const [emailBody, setEmailBody] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (data) {
      setEmailBody(data.email_body || "");
      setEmailSubject(data.email_subject || "");
      setSmsBody(data.sms_body || "");
    }
  }, [data]);

  const [errors, setErrors] = useState({
    emailBody: "",
    emailSubject: "",
    smsBody: "",
  });

  const validateField = (name, value) => {
    switch (name) {
      case "emailBody":
        if (!value.trim()) {
          return "Email Body is required";
        } else if (!value.includes("{%OTP%}")) {
          return "Email Body must include {%OTP%}";
        }
        break;
      case "emailSubject":
        if (!value.trim()) {
          return "Email Subject is required";
        } else if (value.length > 300) {
          return "Email Subject should not exceed 300 characters";
        }
        break;
      case "smsBody":
        if (!value.trim()) {
          return "SMS Body is required";
        } else if (!value.includes("{%OTP%}")) {
          return "SMS Body must include {%OTP%}";
        } else if (!/<br><br>@[\w.-]+\s#{%OTP%}/.test(value)) {
          return "SMS Body must include the required line format, e.g., <br><br>@respective domain #{%OTP%}";
        }
        break;
      default:
        break;
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({ ...errors, [name]: error });

    switch (name) {
      case "emailBody":
        setEmailBody(value);
        break;
      case "emailSubject":
        setEmailSubject(value);
        break;
      case "smsBody":
        setSmsBody(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async () => {
    const emailBodyError = validateField("emailBody", emailBody);
    const emailSubjectError = validateField("emailSubject", emailSubject);
    const smsBodyError = validateField("smsBody", smsBody);

    setErrors({
      emailBody: emailBodyError,
      emailSubject: emailSubjectError,
      smsBody: smsBodyError,
    });

    if (emailBodyError || emailSubjectError || smsBodyError) {
      return;
    }

    try {
      const result = await Controller.ApiController(
        {
          section: "otpConfig",
          uid: uid,
          data: {
            email_body: emailBody,
            email_subject: emailSubject,
            sms_body: smsBody,
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
      console.error("Otp Config", error);
    }
  };

  const isSubmitDisabled = !emailBody && !emailSubject && !smsBody;

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Email Subject"
            variant="outlined"
            fullWidth
            name="emailSubject"
            value={emailSubject}
            onChange={handleChange}
            error={Boolean(errors.emailSubject)}
            helperText={errors.emailSubject}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Email Body"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            name="emailBody"
            value={emailBody}
            onChange={handleChange}
            error={Boolean(errors.emailBody)}
            helperText={errors.emailBody}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="SMS Body"
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            name="smsBody"
            value={smsBody}
            onChange={handleChange}
            error={Boolean(errors.smsBody)}
            helperText={errors.smsBody}
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

export default OtpConfig;
