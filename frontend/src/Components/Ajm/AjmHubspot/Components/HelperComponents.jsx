import { Box, Typography, TextField } from "@mui/material";

export const SignatureField = ({ 
  onClick, 
  signatureImg, 
  disabled = false,
  error = false,
  helperText = null,
  required = false
}) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Box
        onClick={disabled ? undefined : onClick}
        sx={{
          border: error 
            ? "1px solid #d32f2f" 
            : signatureImg 
              ? "1px solid #c4c4c4" 
              : "1px dashed #1976d2",
          borderRadius: "4px",
          p: 2,
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          minHeight: "5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: disabled 
            ? "#f5f5f5" 
            : signatureImg 
              ? "#ffffff" 
              : "#f0f7ff",
          opacity: disabled ? 0.7 : 1,
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: disabled 
              ? "#f5f5f5" 
              : signatureImg 
                ? "#f9f9f9" 
                : "#e3f2fd",
            boxShadow: disabled ? "none" : "0px 2px 4px rgba(0,0,0,0.1)",
          },
        }}
      >
        {signatureImg ? (
          <img
            src={signatureImg}
            alt="Signature"
            style={{ maxHeight: "70px", maxWidth: "100%" }}
          />
        ) : (
          <Typography 
            color={disabled ? "text.disabled" : "text.secondary"}
          >
            {disabled ? "Signature" : "Click to Sign"}
            {required && !disabled && <span style={{ color: "#d32f2f" }}> *</span>}
          </Typography>
        )}
      </Box>
      {helperText && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ ml: 1, mt: 0.5, display: "block" }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export const DateField = ({ 
  onClick, 
  dateValue, 
  disabled = false,
  error = false,
  helperText = null,
  required = false
}) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Box
        onClick={disabled ? undefined : onClick}
        sx={{
          border: error 
            ? "1px solid #d32f2f" 
            : dateValue 
              ? "1px solid #c4c4c4" 
              : "1px dashed #1976d2",
          borderRadius: "4px",
          p: 2,
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          minHeight: "5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: disabled 
            ? "#f5f5f5" 
            : dateValue 
              ? "#ffffff" 
              : "#f0f7ff",
          opacity: disabled ? 0.7 : 1,
          transition: "all 0.2s",
          "&:hover": {
            backgroundColor: disabled 
              ? "#f5f5f5" 
              : dateValue 
                ? "#f9f9f9" 
                : "#e3f2fd",
            boxShadow: disabled ? "none" : "0px 2px 4px rgba(0,0,0,0.1)",
          },
        }}
      >
        {dateValue ? (
          <Typography color={disabled ? "text.disabled" : "text.primary"}>
            {dateValue}
          </Typography>
        ) : (
          <Typography color={disabled ? "text.disabled" : "text.secondary"}>
            {disabled ? "Date" : "Click to Add Date"}
            {required && !disabled && <span style={{ color: "#d32f2f" }}> *</span>}
          </Typography>
        )}
      </Box>
      {helperText && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ ml: 1, mt: 0.5, display: "block" }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export const NameField = ({ 
  value, 
  onChange, 
  disabled = false,
  error = false,
  helperText = null,
  required = false
}) => {
  return (
    <Box sx={{ width: "100%" }}>
      <TextField
        fullWidth
        placeholder={disabled ? "" : "Enter your name"}
        value={value || ""}
        onChange={onChange}
        variant="outlined"
        size="small"
        disabled={disabled}
        error={error}
        required={required && !disabled}
        InputProps={{
          readOnly: disabled,
        }}
      />
      {helperText && (
        <Typography 
          variant="caption" 
          color="error" 
          sx={{ ml: 1, mt: 0.5, display: "block" }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

// Keep the original utility functions
export const generateFilledHTML = (htmlContent, signatures, dates, names) => {
  let updatedHtml = htmlContent;
  Object.keys(signatures).forEach(fieldId => {
    const signatureImg = signatures[fieldId];
    const signaturePlaceholder = new RegExp(`<div[^>]*id="${fieldId}"[^>]*>.*?</div>`, 'gs');
    const signatureReplacement = `<div id="${fieldId}"><img src="${signatureImg}" alt="Signature" style="max-width: 100px; height: auto;"/></div>`;
    updatedHtml = updatedHtml.replace(signaturePlaceholder, signatureReplacement);
  });
  
  // Replace date placeholders with actual dates
  Object.keys(dates).forEach(fieldId => {
    const dateValue = dates[fieldId];
    const datePlaceholder = new RegExp(`<div[^>]*id="${fieldId}"[^>]*>.*?</div>`, 'gs');
    const dateReplacement = `<div id="${fieldId}">${dateValue}</div>`;
    updatedHtml = updatedHtml.replace(datePlaceholder, dateReplacement);
  });
  
  // Replace name placeholders with actual names
  Object.keys(names).forEach(fieldId => {
    const nameValue = names[fieldId];
    const namePlaceholder = new RegExp(`<div[^>]*id="${fieldId}"[^>]*>.*?</div>`, 'gs');
    const nameReplacement = `<div id="${fieldId}">${nameValue}</div>`;
    updatedHtml = updatedHtml.replace(namePlaceholder, nameReplacement);
  });
  
  return updatedHtml;
};

export const downloadPDF = (pdfBuffer) => {
  const blob = base64ToBlob(pdfBuffer, 'application/pdf');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `form_${new Date().toISOString().slice(0, 10)}.pdf`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const base64ToBlob = (base64, mimeType) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

