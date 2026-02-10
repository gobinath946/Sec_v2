import React, { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Modal,
  Tab,
  Tabs,
  TextField,
  Typography,
  Paper,
  useMediaQuery,
  useTheme,
  Grid,
  IconButton,
  Stack,
  Divider,
  Fade,
  Container,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CreateIcon from "@mui/icons-material/Create";
import ImageIcon from "@mui/icons-material/Image";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { useSnackbar } from "notistack";
import { Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config";
import logo from "../Assets/Images/Securegateway-Gradient.png";

const fonts = [
  {
    name: "Classic",
    style: {
      fontFamily: "'Brush Script MT', cursive",
      fontSize: "32px", // Reduced from 42px
      fontWeight: "normal",
    },
  },
  {
    name: "Elegant",
    style: {
      fontFamily: "'Lucida Handwriting', cursive",
      fontSize: "28px", // Reduced from 38px
      fontWeight: "normal",
    },
  },
  {
    name: "Modern",
    style: {
      fontFamily: "'Segoe Script', cursive",
      fontSize: "26px", // Reduced from 36px
      fontWeight: "bold",
    },
  },
  {
    name: "Casual",
    style: {
      fontFamily: "'Comic Sans MS', cursive",
      fontSize: "24px", // Reduced from 32px
      fontWeight: "normal",
    },
  },
  {
    name: "Professional",
    style: {
      fontFamily: "'Palatino Linotype', serif",
      fontSize: "30px", // Reduced from 40px
      fontWeight: "bold",
    },
  },
];

const colors = [
  { name: "Blue", value: "#1976d2" },
  { name: "Black", value: "#000000" },
  { name: "Dark Blue", value: "#0d47a1" },
  { name: "Green", value: "#2e7d32" },
  { name: "Purple", value: "#6a1b9a" },
  { name: "Red", value: "#d32f2f" },
];

const SignaturePad = ({ onSignature, email, sf_id }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [signature, setSignature] = useState(null);
  const [penColor, setPenColor] = useState("#1976d2");
  const [selectedFont, setSelectedFont] = useState(0);
  const [text, setText] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const sigCanvas = useRef(null);
  const fileInput = useRef(null);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { enqueueSnackbar } = useSnackbar();

  const handleOpen = () => {
    if (isAgreed) {
      setIsModalOpen(true);
      logSignatureActivity();
    } else {
      enqueueSnackbar("Please agree to the terms and conditions first", {
        variant: "warning",
      });
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleSave = () => {
    if (tab === 0 && sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        enqueueSnackbar("Please draw your signature", { variant: "warning" });
        return;
      }
      const dataURL = sigCanvas.current
        .getTrimmedCanvas()
        .toDataURL("image/png");
      setSignature(dataURL);
      onSignature(dataURL);
    } else if (tab === 2) {
      if (!text.trim()) {
        enqueueSnackbar("Please type your signature", { variant: "warning" });
        return;
      }
      handleTextSubmit();
    }
    handleClose();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      enqueueSnackbar("Only PNG or JPEG images are allowed", {
        variant: "error",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      enqueueSnackbar("File size should be below 10MB", { variant: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400; // Reduced from 500
        canvas.height = 160; // Reduced from 200
        const ctx = canvas.getContext("2d");

        const aspectRatio = img.width / img.height;
        let newWidth = 400;
        let newHeight = 400 / aspectRatio;

        if (newHeight > 160) {
          newHeight = 160;
          newWidth = 160 * aspectRatio;
        }

        const x = (400 - newWidth) / 2;
        const y = (160 - newHeight) / 2;

        ctx.drawImage(img, x, y, newWidth, newHeight);

        const resizedSignature = canvas.toDataURL("image/png");
        setSignature(resizedSignature);
        onSignature(resizedSignature);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const fontSize = 50; // Reduced from 65
    const fontFamily = fonts[selectedFont].style.fontFamily;
    context.font = `${fontSize}px ${fontFamily}`;
    const textWidth = context.measureText(text).width;
    const padding = 16; // Reduced from 20
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;
    context.font = `${fontSize}px ${fontFamily}`;
    context.fillStyle = penColor;
    context.fillText(text, padding, fontSize + padding / 2);

    const signatureDataUrl = canvas.toDataURL("image/png");
    setSignature(signatureDataUrl);
    onSignature(signatureDataUrl);
  };

  const handleTextChange = (event) => {
    const newText = event.target.value;
    if (newText.length <= 30) {
      setText(newText);
    } else {
      enqueueSnackbar("Maximum 30 characters allowed", { variant: "warning" });
    }
  };

  const handleAgreementChange = (event) => {
    setIsAgreed(event.target.checked);
  };

  const logSignatureActivity = async () => {
    try {
      const data = {
        trigger_event: "E_Sign Event",
        message_id: sf_id,
        email: email,
        creation_time: new Date(),
      };

      await axios.post(`${BASE_URL}/log_creation`, data);
    } catch (error) {
      console.error("Error logging signature activity:", error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 1.5 }}>
      {" "}
      {/* Reduced padding */}
      {/* Terms agreement */}
      <Paper
        elevation={0}
        sx={{
          p: 1, // Reduced from 1.5
          mb: 1.5, // Reduced from 2
          border: "1px solid #e0e0e0",
          borderRadius: 1,
          backgroundColor: "#f9fafb",
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={isAgreed}
              onChange={handleAgreementChange}
              color="primary"
              size="medium"
            />
          }
          label={
            <Link
              to="/esign_terms"
              target="_blank"
              style={{ textDecoration: "none" }}
            >
              <Typography color="primary" variant="caption">
                {" "}
                {/* Changed from body2 to caption */}I agree to the terms and
                conditions of E-Sign
              </Typography>
            </Link>
          }
        />
      </Paper>
      {/* Signature box or preview */}
      <Paper
        elevation={2}
        onClick={handleOpen}
        sx={{
          p: 1.5, // Reduced from 2
          height: 80, // Reduced from 100
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px ${signature ? "solid" : "dashed"} ${
            signature ? "#e0e0e0" : "#1976d2"
          }`,
          borderRadius: 1,
          cursor: isAgreed ? "pointer" : "not-allowed",
          backgroundColor: "#fff",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: isAgreed ? "#f0f7ff" : "#fff",
            borderColor: isAgreed ? "#3f51b5" : "#1976d2",
            boxShadow: isAgreed ? 3 : 2,
          },
        }}
      >
        {signature ? (
          <img
            src={signature}
            alt="Signature"
            style={{ maxHeight: "90%", maxWidth: "90%" }}
          />
        ) : (
          <Box sx={{ textAlign: "center" }}>
            <CreateIcon sx={{ fontSize: 22, color: "#9e9e9e", mb: 0.5 }} />{" "}
            {/* Reduced from 28 */}
            <Typography
              color="text.secondary"
              variant="caption"
              component="div"
            >
              Click to add your signature
            </Typography>
          </Box>
        )}
      </Paper>
      {/* Signature Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleClose}
        closeAfterTransition
        aria-labelledby="signature-modal-title"
      >
        <Fade in={isModalOpen}>
          <Paper
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: isSmallScreen ? "95%" : isMediumScreen ? "80%" : "600px", // Reduced from 85% and 700px
              maxHeight: "85vh", // Reduced from 90vh
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              outline: "none",
              boxShadow: 24,
              overflow: "hidden",
              bgcolor: "white",
            }}
          >
            {/* Modal Header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1.5, // Reduced from 2
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#db2727",
              }}
            >
              <Typography
                id="signature-modal-title"
                variant="subtitle2" // Changed from subtitle1
                fontWeight="medium"
                color="white"
                sx={{ fontSize: "16px", fontWeight: "600" }} // Reduced from 18px
              >
                Add Your Signature
              </Typography>
              <Grid
                sx={{ backgroundColor: "white", p: 0.5, borderRadius: 1 }} // Reduced padding
              >
                <img
                  src={logo}
                  alt="icon"
                  style={{ height: "40px" }} // Reduced from 50px
                  className="profile"
                />
              </Grid>
            </Box>

            {/* Content Area */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Tabs */}
              <Box
                sx={{
                  backgroundColor: "#f8f9fa",
                  px: 2, // Reduced from 3
                  py: 1.5, // Reduced from 2
                  borderBottom: "1px solid #e9ecef",
                }}
              >
                <Tabs
                  value={tab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  indicatorColor="primary"
                  textColor="primary"
                  sx={{
                    "& .MuiTab-root": {
                      minHeight: 40, // Reduced from 48
                      py: 0.5, // Reduced from 1
                      px: 2, // Reduced from 3
                      fontSize: 12, // Reduced from 14
                      textTransform: "none",
                      fontWeight: 500,
                      color: "#6c757d",
                      "&.Mui-selected": {
                        color: "#dc3545",
                        fontWeight: 600,
                      },
                    },
                    "& .MuiTabs-indicator": {
                      height: 2, // Reduced from 3
                      borderRadius: 2,
                      backgroundColor: "#dc3545",
                    },
                  }}
                >
                  <Tab
                    icon={<CreateIcon fontSize="small" />}
                    iconPosition="start"
                    label="Draw"
                  />
                  <Tab
                    icon={<ImageIcon fontSize="small" />}
                    iconPosition="start"
                    label="Upload"
                  />
                  <Tab
                    icon={<TextFieldsIcon fontSize="small" />}
                    iconPosition="start"
                    label="Type"
                  />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ flex: 1, p: 2, overflow: "auto" }}>
                {" "}
                {/* Reduced from 3 */}
                {/* Draw Tab */}
                {tab === 0 && (
                  <Box sx={{ height: "100%" }}>
                    {/* Signature Canvas */}
                    <Paper
                      elevation={0}
                      sx={{
                        border: "2px solid #e9ecef",
                        borderRadius: 2,
                        mb: 2, // Reduced from 3
                        height: 240, // Reduced from 300
                        backgroundColor: "#fff",
                        overflow: "hidden",
                      }}
                    >
                      <SignatureCanvas
                        ref={sigCanvas}
                        penColor={penColor}
                        canvasProps={{
                          width: isSmallScreen ? 480 : 560, // Reduced from 580 and 640
                          height: 240, // Reduced from 300
                          className: "signature-canvas",
                          style: { width: "100%", height: "100%" },
                        }}
                        backgroundColor="#ffffff"
                        minWidth={1.5} // Reduced from 2
                        maxWidth={3} // Reduced from 4
                      />
                    </Paper>

                    {/* Controls */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f8f9fa",
                        borderRadius: 2,
                        p: 1.5, // Reduced from 2
                      }}
                    >
                      {/* Pen Color */}
                      <Box>
                        <Typography
                          variant="caption" // Changed from body2
                          fontWeight="600"
                          sx={{ mb: 0.5, color: "#495057" }} // Reduced margin
                        >
                          Pen Color
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {" "}
                          {/* Reduced gap */}
                          {colors.map((color) => (
                            <Box
                              key={color.name}
                              onClick={() => setPenColor(color.value)}
                              sx={{
                                width: 26, // Reduced from 32
                                height: 26, // Reduced from 32
                                backgroundColor: color.value,
                                borderRadius: "50%",
                                cursor: "pointer",
                                border:
                                  penColor === color.value
                                    ? "2px solid #fff" // Reduced from 3px
                                    : "1px solid #dee2e6", // Reduced from 2px
                                boxShadow:
                                  penColor === color.value
                                    ? "0 0 0 1px #007bff" // Reduced from 2px
                                    : "0 1px 2px rgba(0,0,0,0.1)", // Reduced shadow
                                transition: "all 0.2s",
                                "&:hover": {
                                  transform: "scale(1.05)", // Reduced from 1.1
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)", // Reduced shadow
                                },
                              }}
                              title={color.name}
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Clear Button */}
                      <Button
                        startIcon={<DeleteIcon fontSize="small" />}
                        onClick={handleClear}
                        variant="outlined"
                        color="error"
                        size="small" // Changed from medium
                        sx={{
                          fontWeight: 600,
                          textTransform: "uppercase",
                          px: 2, // Reduced from 3
                          py: 0.5, // Reduced from 1
                          borderWidth: 1, // Reduced from 2
                          fontSize: 10, // Reduced from 12
                          "&:hover": {
                            borderWidth: 1, // Reduced from 2
                          },
                        }}
                      >
                        Clear
                      </Button>
                    </Box>
                  </Box>
                )}
                {/* Upload Tab */}
                {tab === 1 && (
                  <Box sx={{ textAlign: "center", height: "100%" }}>
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      ref={fileInput}
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />

                    <Box
                      sx={{
                        border: "2px dashed #007bff", // Reduced from 3px
                        borderRadius: 2, // Reduced from 3
                        p: 3, // Reduced from 4
                        backgroundColor: "#e7f3ff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: 240, // Reduced from 300
                        mb: 2, // Reduced from 3
                      }}
                    >
                      {signature && tab === 1 ? (
                        <img
                          src={signature}
                          alt="Signature Preview"
                          style={{ maxWidth: "100%", maxHeight: 160 }} // Reduced from 200
                        />
                      ) : (
                        <>
                          <ImageIcon
                            sx={{ fontSize: 48, color: "#007bff", mb: 1.5 }} // Reduced from 64 and mb 2
                          />
                          <Typography
                            variant="subtitle2"
                            gutterBottom
                            color="#495057"
                          >
                            {" "}
                            {/* Changed from h6 */}
                            Upload your signature image
                          </Typography>
                        </>
                      )}
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<FileUploadIcon fontSize="small" />}
                      onClick={() => fileInput.current.click()}
                      size="medium" // Changed from large
                      sx={{
                        px: 3, // Reduced from 4
                        py: 1, // Reduced from 1.5
                        fontWeight: 600,
                        textTransform: "uppercase",
                        mb: 1.5, // Reduced from 2
                      }}
                    >
                      Choose File
                    </Button>

                    <Typography
                      variant="caption" // Changed from body2
                      color="text.secondary"
                      display="block"
                    >
                      Accepted formats: PNG, JPEG (max 10MB)
                    </Typography>
                  </Box>
                )}
                {/* Type Tab */}
                {tab === 2 && (
                  <Box sx={{ height: "100%" }}>
                    <TextField
                      label="Type your signature"
                      variant="outlined"
                      fullWidth
                      size="small" // Changed from medium
                      value={text}
                      onChange={handleTextChange}
                      sx={{
                        mb: 2, // Reduced from 3
                        "& .MuiOutlinedInput-root": {
                          fontSize: "16px", // Reduced from 18px
                        },
                      }}
                      InputProps={{
                        style: {
                          ...fonts[selectedFont].style,
                          color: penColor,
                          fontSize: "20px", // Reduced from 24px
                        },
                      }}
                      placeholder="Gobi"
                      helperText={`${text.length}/30 characters`}
                    />

                    <Stack spacing={2}>
                      {" "}
                      {/* Reduced from 3 */}
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          gutterBottom
                          sx={{ color: "#495057" }}
                        >
                          {" "}
                          {/* Changed from body1 */}
                          Font Style
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {" "}
                          {/* Reduced from 1.5 */}
                          {fonts.map((font, index) => (
                            <Button
                              key={index}
                              variant={
                                selectedFont === index
                                  ? "contained"
                                  : "outlined"
                              }
                              size="small" // Changed from medium
                              onClick={() => setSelectedFont(index)}
                              sx={{
                                textTransform: "none",
                                px: 1.5, // Reduced from 2
                                py: 0.5, // Reduced from 1
                                fontWeight: selectedFont === index ? 600 : 500,
                                backgroundColor:
                                  selectedFont === index
                                    ? "#007bff"
                                    : "transparent",
                                borderColor:
                                  selectedFont === index
                                    ? "#007bff"
                                    : "#dee2e6",
                                "&:hover": {
                                  backgroundColor:
                                    selectedFont === index
                                      ? "#0056b3"
                                      : "#f8f9fa",
                                },
                              }}
                            >
                              <Typography
                                style={{
                                  fontFamily: font.style.fontFamily,
                                  fontSize: 14, // Reduced from 16
                                }}
                              >
                                {font.name}
                              </Typography>
                            </Button>
                          ))}
                        </Box>
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          gutterBottom
                          sx={{ color: "#495057" }}
                        >
                          {" "}
                          {/* Changed from body1 */}
                          Text Color
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {" "}
                          {/* Reduced from 1.5 */}
                          {colors.map((color) => (
                            <Box
                              key={color.name}
                              onClick={() => setPenColor(color.value)}
                              sx={{
                                width: 30, // Reduced from 36
                                height: 30, // Reduced from 36
                                backgroundColor: color.value,
                                borderRadius: "50%",
                                cursor: "pointer",
                                border:
                                  penColor === color.value
                                    ? "2px solid #fff" // Reduced from 3px
                                    : "1px solid #dee2e6", // Reduced from 2px
                                boxShadow:
                                  penColor === color.value
                                    ? "0 0 0 1px #007bff" // Reduced from 2px
                                    : "0 1px 2px rgba(0,0,0,0.1)", // Reduced shadow
                                transition: "all 0.2s",
                                "&:hover": {
                                  transform: "scale(1.05)", // Reduced from 1.1
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)", // Reduced shadow
                                },
                              }}
                              title={color.name}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Stack>

                    {text && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2, // Reduced from 3
                          mt: 2, // Reduced from 3
                          border: "2px solid #e9ecef",
                          borderRadius: 2,
                          textAlign: "center",
                          backgroundColor: "#f8f9fa",
                          minHeight: 60, // Reduced from 80
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          style={{
                            fontFamily: fonts[selectedFont].style.fontFamily,
                            fontSize: "28px", // Reduced from 36px
                            color: penColor,
                            fontWeight: fonts[selectedFont].style.fontWeight,
                          }}
                        >
                          {text}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Footer with Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1.5, // Reduced from 2
                p: 2, // Reduced from 3
                borderTop: "1px solid #e9ecef",
                backgroundColor: "#f8f9fa",
              }}
            >
              <Button
                onClick={handleClose}
                variant="outlined"
                size="medium" // Changed from large
                sx={{
                  px: 3, // Reduced from 4
                  py: 1, // Reduced from 1.5
                  fontWeight: 600,
                  textTransform: "uppercase",
                  borderWidth: 1, // Reduced from 2
                  "&:hover": {
                    borderWidth: 1, // Reduced from 2
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                color="primary"
                size="medium" // Changed from large
                startIcon={<CheckCircleIcon fontSize="small" />}
                sx={{
                  px: 3, // Reduced from 4
                  py: 1, // Reduced from 1.5
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Apply
              </Button>
            </Box>
          </Paper>
        </Fade>
      </Modal>
    </Container>
  );
};

export default SignaturePad;
