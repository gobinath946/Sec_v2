import React, { useState, useEffect, useRef } from "react";
import {
  CircularProgress,
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Backdrop,
} from "@mui/material";
import { useSnackbar } from "notistack";
import parse from "html-react-parser";
import SignaturePad from "../../../Lib/SignaturePad";
import { useNavigate } from "react-router-dom";
import {
  SignatureField,
  DateField,
  NameField,
} from "./Components/HelperComponents";
import { BASE_URL } from "../../../config";
import axios from "axios";
import { RotateSpinner } from "react-spinners-kit";

const AjmHubspot = ({
  Bwd_Data,
  id,
  rec_email,
  rec_mobile,
  cus_id,
  rec_name,
  signatureData,
  is_readable,
}) => {
  const [HubspotData, setHubspotData] = useState(Bwd_Data);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [signatures, setSignatures] = useState({});
  const [dates, setDates] = useState({});
  const Tempname = sessionStorage.getItem("TempName");
  const navigate = useNavigate();
  const [names, setNames] = useState({});
  const [currentFieldId, setCurrentFieldId] = useState(null);
  const [configData, setConfigData] = useState(HubspotData.secureGatewayConfig);
  console.log(configData)
  const [processing, setProcessing] = useState(false);
  const [disabledFields, setDisabledFields] = useState({});
  const [requiredFields, setRequiredFields] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [userSigningOrder, setUserSigningOrder] = useState(null);

  const { enqueueSnackbar } = useSnackbar();
  const pdfRef = useRef(null);

  // Function to remove target elements from HTML content
  const removeTargetElements = (html) => {
    if (!configData || !configData.remove_target_elements || !Array.isArray(configData.remove_target_elements)) {
      return html;
    }

    let modifiedHtml = html;

    // Process each element in the remove_target_elements array
    configData.remove_target_elements.forEach(elementIdentifier => {
      // Handle comma-separated values within a single string
      const identifiers = elementIdentifier.split(',').map(id => id.trim());
      
      identifiers.forEach(identifier => {
        if (identifier) {
          // Remove elements by ID
          const idRegex = new RegExp(`<[^>]*\\s+id=["']${identifier}["'][^>]*>.*?</[^>]*>`, 'gis');
          modifiedHtml = modifiedHtml.replace(idRegex, '');
          
          // Also try to remove by class name (in case it's a class)
          const classRegex = new RegExp(`<[^>]*\\s+class=["'][^"']*\\b${identifier}\\b[^"']*["'][^>]*>.*?</[^>]*>`, 'gis');
          modifiedHtml = modifiedHtml.replace(classRegex, '');
          
          // Remove self-closing tags with the identifier
          const selfClosingIdRegex = new RegExp(`<[^>]*\\s+id=["']${identifier}["'][^>]*/>`, 'gis');
          modifiedHtml = modifiedHtml.replace(selfClosingIdRegex, '');
          
          const selfClosingClassRegex = new RegExp(`<[^>]*\\s+class=["'][^"']*\\b${identifier}\\b[^"']*["'][^>]*/>`, 'gis');
          modifiedHtml = modifiedHtml.replace(selfClosingClassRegex, '');
        }
      });
    });

    return modifiedHtml;
  };

  // Function to determine if the current user is authorized to sign based on email
  useEffect(() => {
    if (configData && configData.confidential_data && rec_email) {
      const userConfig = configData.confidential_data.find(
        (user) => user.e_sign_email.toLowerCase() === rec_email.toLowerCase()
      );

      if (userConfig) {
        setUserSigningOrder(userConfig.e_sign_order);

        // Initialize all fields as disabled by default
        const disabled = {};
        const required = {};

        // For each user in the config
        configData.confidential_data.forEach((user) => {
          // For each field in this user's config
          user.e_sign_config.forEach((field) => {
            const fieldId =
              field.e_sign_target_id ||
              field.e_date_target_id ||
              field.e_name_target_id;

            // If this is the current user's config, enable fields
            if (user.e_sign_email.toLowerCase() === rec_email.toLowerCase()) {
              disabled[fieldId] = false;
              if (field.required) {
                required[fieldId] = true;
              }
            } else {
              // Disable fields for other users
              disabled[fieldId] = true;
            }
          });
        });

        setDisabledFields(disabled);
        setRequiredFields(required);
      } else {
        // If user email doesn't match any in config, disable all fields
        const allFields = {};
        configData.confidential_data.forEach((user) => {
          user.e_sign_config.forEach((field) => {
            const fieldId =
              field.e_sign_target_id ||
              field.e_date_target_id ||
              field.e_name_target_id;
            allFields[fieldId] = true;
          });
        });
        setDisabledFields(allFields);

        // Show a notification that the user is not authorized
        enqueueSnackbar("You are not authorized to sign this document", {
          variant: "warning",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
        });
      }
    }
  }, [configData, rec_email, enqueueSnackbar]);

  // Function to extract prepopulated data from signatureData
  const extractPrepopulatedData = () => {
    if (!signatureData || !Array.isArray(signatureData)) return {};

    const extractedData = {};

    signatureData.forEach((userEntry) => {
      if (userEntry.entries && Array.isArray(userEntry.entries)) {
        userEntry.entries.forEach((entry) => {
          const targetId = entry.target_id;
          if (targetId) {
            // Store the value from the entry using the target_id as key
            extractedData[targetId] = entry[targetId] || "";

            // Mark this field as disabled
            setDisabledFields((prev) => ({
              ...prev,
              [targetId]: true,
            }));
          }
        });
      }
    });

    return extractedData;
  };

  // Function to inject prepopulated data directly into HTML content
  const injectPrepopulatedDataIntoHTML = (html) => {
    if (
      !signatureData ||
      !Array.isArray(signatureData) ||
      signatureData.length === 0
    ) {
      return html;
    }

    let modifiedHtml = html;
    const prepopulatedData = extractPrepopulatedData();

    Object.keys(prepopulatedData).forEach((targetId) => {
      const value = prepopulatedData[targetId];
      const targetType = getFieldTypeFromSignatureData(targetId);

      if (!value || !targetType) return;
      const regex = new RegExp(
        `<([^>]*)\\s+id=["']${targetId}["']([^>]*)>([^<]*)<\/([^>]*)>`,
        "g"
      );
      if (targetType === "sign") {
        modifiedHtml = modifiedHtml.replace(
          regex,
          (match, tag1, attrs, content, tag2) => {
            const hasClass = attrs.includes("class=");
            const modifiedAttrs = hasClass
              ? attrs.replace(
                  /class=["']([^"']*)["']/,
                  (m, existingClasses) =>
                    `class="${existingClasses} prepopulated-field"`
                )
              : `${attrs} class="prepopulated-field"`;

            return `<${tag1} id="${targetId}" ${modifiedAttrs} disabled="disabled">
            <img src="${value}" alt="Signature" style="max-width: 100%; " />
          </${tag2}>`;
          }
        );
      } else if (targetType === "date") {
        modifiedHtml = modifiedHtml.replace(
          regex,
          (match, tag1, attrs, content, tag2) => {
            const hasClass = attrs.includes("class=");
            const modifiedAttrs = hasClass
              ? attrs.replace(
                  /class=["']([^"']*)["']/,
                  (m, existingClasses) =>
                    `class="${existingClasses} prepopulated-field"`
                )
              : `${attrs} class="prepopulated-field"`;

            return `<${tag1} id="${targetId}" ${modifiedAttrs} disabled="disabled">${value}</${tag2}>`;
          }
        );
      } else if (targetType === "input_text" || targetType === "e_name") {
        modifiedHtml = modifiedHtml.replace(
          regex,
          (match, tag1, attrs, content, tag2) => {
            const hasClass = attrs.includes("class=");
            const modifiedAttrs = hasClass
              ? attrs.replace(
                  /class=["']([^"']*)["']/,
                  (m, existingClasses) =>
                    `class="${existingClasses} prepopulated-field"`
                )
              : `${attrs} class="prepopulated-field"`;

            return `<${tag1} id="${targetId}" ${modifiedAttrs} disabled="disabled">${value}</${tag2}>`;
          }
        );
      }
    });

    return modifiedHtml;
  };

  // Function to determine field type from signature data
  const getFieldTypeFromSignatureData = (targetId) => {
    if (!signatureData || !Array.isArray(signatureData)) return null;

    for (const userEntry of signatureData) {
      if (userEntry.entries && Array.isArray(userEntry.entries)) {
        for (const entry of userEntry.entries) {
          if (entry.target_id === targetId) {
            return entry.target_type;
          }
        }
      }
    }

    return null;
  };

  useEffect(() => {
    const fetchHtml = async () => {
      const url = HubspotData.Hubspot_Esign_Data.Html_Link;
      if (!url) {
        return;
      }
      try {
        const response = await axios.post(`${BASE_URL}/get_hubspot_html`, {
          url: url,
        });
        
        // Apply all HTML modifications in sequence
        let modifiedHtml = response.data;
        
        // First, remove target elements
        modifiedHtml = removeTargetElements(modifiedHtml);
        
        // Then, inject prepopulated data
        modifiedHtml = injectPrepopulatedDataIntoHTML(modifiedHtml);
        
        setHtmlContent(modifiedHtml);
        setConfigData(HubspotData.secureGatewayConfig);
      } catch (error) {
        console.error("Error fetching HTML:", error);
        setError(error.message);
        enqueueSnackbar(`Error loading form: ${error.message}`, {
          variant: "error",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHtml();
  }, [HubspotData, signatureData, enqueueSnackbar]);

  const handleOpenSignatureDialog = (fieldId) => {
    // Don't open dialog if field is disabled
    if (disabledFields[fieldId]) return;

    setCurrentFieldId(fieldId);
    setOpenDialog(true);

    // Clear validation error when opening signature dialog
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldId]: null,
      }));
    }
  };

  const handleDateClick = (fieldId) => {
    // Don't update if field is disabled
    if (disabledFields[fieldId]) return;

    const now = new Date();
    const formattedDateTime = now.toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      // second: "2-digit",
      hour12: true,
    });

    setDates({
      ...dates,
      [fieldId]: formattedDateTime,
    });

    // Clear validation error when setting date/time
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldId]: null,
      }));
    }
  };

  const handleNameChange = (fieldId, event) => {
    if (disabledFields[fieldId]) return;

    setNames({
      ...names,
      [fieldId]: event.target.value,
    });

    // Clear validation error when typing
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldId]: null,
      }));
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSignatureComplete = (signatureDataUrl) => {
    if (currentFieldId && !disabledFields[currentFieldId]) {
      setSignatures({
        ...signatures,
        [currentFieldId]: signatureDataUrl,
      });

      // Clear validation error when setting signature
      if (validationErrors[currentFieldId]) {
        setValidationErrors((prev) => ({
          ...prev,
          [currentFieldId]: null,
        }));
      }

      setOpenDialog(false);
    }
  };

  // Validate required fields before submission
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Check all required fields
    Object.keys(requiredFields).forEach((fieldId) => {
      if (requiredFields[fieldId]) {
        const componentType = getComponentTypeForField(fieldId);

        if (componentType === "e_sign" || componentType === "sign") {
          if (!signatures[fieldId]) {
            errors[fieldId] = "Signature is required";
            isValid = false;
          }
        } else if (componentType === "e_date" || componentType === "date") {
          if (!dates[fieldId]) {
            errors[fieldId] = "Date is required";
            isValid = false;
          }
        } else if (
          componentType === "e_name" ||
          componentType === "input_text"
        ) {
          if (!names[fieldId] || names[fieldId].trim() === "") {
            errors[fieldId] = "This field is required";
            isValid = false;
          }
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    // Validate the form first
    if (!validateForm()) {
      enqueueSnackbar("Please fill in all required fields", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      return;
    }

    setProcessing(true);
    try {
      const formData = {
        signatures: signatures,
        dates,
        names,
      };

      const now = new Date();
      const formattedDate = now
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .split("/")
        .reverse()
        .join("-");

      const formattedTime = now
        .toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
        .replace(/:/g, "-");

      const Pdf_Name = HubspotData.Hubspot_Esign_Data.Pdf_Name;
      const filename = `${rec_name}-${Pdf_Name}-${formattedDate}_${formattedTime}.pdf`;
      const msg_id = sessionStorage.getItem("uid");

      // Send data to backend for server-side PDF generation
      const payload = {
        return_data: formData,
        message_id: id,
        rec_email: rec_email,
        file_name: filename,
        file_mime_type: "pdf",
        type: "html",
        action: "Hubspot_Esign",
        service: "S3",
        stepper: "ajm_rental",
        msg_id: msg_id,
        pdf_name: Pdf_Name,
        signatures: signatures,
        submission_time: now.toISOString(),
        signing_order: userSigningOrder,
        html_link: HubspotData.Hubspot_Esign_Data.Html_Link // Send HTML link to backend
      };

      const response = await axios.put(
        `${BASE_URL}/api/v2/s3/files/${cus_id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      navigate(`/result/success/${Tempname}Result`);
    } catch (error) {
      console.error("Submission error:", error);
      enqueueSnackbar(`Error submitting form: ${error.message}`, {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to find the component type for a field ID
  const getComponentTypeForField = (fieldId) => {
    if (!configData) return null;

    for (const user of configData.confidential_data) {
      for (const config of user.e_sign_config) {
        if (
          config.e_sign_target_id === fieldId ||
          config.e_date_target_id === fieldId ||
          config.e_name_target_id === fieldId
        ) {
          return config.component;
        }
      }
    }
    return null;
  };

  // Replace signature fields in the HTML content
  const options = {
    replace: (domNode) => {
      if (domNode.attribs && domNode.attribs.id) {
        const fieldId = domNode.attribs.id;
        const componentType = getComponentTypeForField(fieldId);
        const isDisabled = disabledFields[fieldId];
        const validationError = validationErrors[fieldId];
        const isRequired = requiredFields[fieldId];

        // Check if the field already has prepopulated content
        if (
          (domNode.attribs.class &&
            domNode.attribs.class.includes("prepopulated-field")) ||
          domNode.attribs.disabled === "disabled"
        ) {
          return undefined;
        }

        if (componentType === "e_sign" || componentType === "sign") {
          return (
            <SignatureField
              onClick={() => handleOpenSignatureDialog(fieldId)}
              signatureImg={signatures[fieldId]}
              disabled={isDisabled}
              error={!!validationError}
              helperText={validationError}
              required={isRequired}
            />
          );
        } else if (componentType === "e_date" || componentType === "date") {
          return (
            <DateField
              onClick={() => handleDateClick(fieldId)}
              dateValue={dates[fieldId]}
              disabled={isDisabled}
              error={!!validationError}
              helperText={validationError}
              required={isRequired}
            />
          );
        } else if (
          componentType === "e_name" ||
          componentType === "input_text"
        ) {
          return (
            <NameField
              value={names[fieldId]}
              onChange={(e) => handleNameChange(fieldId, e)}
              disabled={isDisabled}
              error={!!validationError}
              helperText={validationError}
              required={isRequired}
            />
          );
        }
      }
      return undefined;
    },
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        flexDirection="column"
      >
        <CircularProgress />
        <Typography variant="h6" mt={2}>
          Loading form...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, m: 2, textAlign: "center" }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading Form
        </Typography>
        <Typography>{error}</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 2 }} ref={pdfRef}>
      <div className="form-content">{parse(htmlContent, options)}</div>
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={processing}
        >
          {processing ? "Processing..." : "Submit"}
        </Button>
      </Box>

      {/* Signature Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Your Signature</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <SignaturePad
            onSignature={handleSignatureComplete}
            email={rec_email}
            mobile={rec_mobile}
            sf_id={id}
          />
        </DialogContent>
      </Dialog>
      {processing && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RotateSpinner size={60} thickness={20} color="red" />
        </Box>
      )}
    </Box>
  );
};

export default AjmHubspot;