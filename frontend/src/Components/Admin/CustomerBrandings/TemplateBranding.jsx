import React, { useState, useEffect } from "react";
import axios from "axios";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "notistack";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";
import { BASE_URL } from "../../../config";
import { PushSpinner } from "react-spinners-kit";
import { Edit, Delete } from "@mui/icons-material";

const TemplateUpload = ({ uid }) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [templates, setTemplates] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const [uploading, setUploading] = useState({});
  const { enqueueSnackbar } = useSnackbar();
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonData, setJsonData] = useState({});
  const [jsonCopySuccess, setJsonCopySuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addTemplateModalOpen, setAddTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editTemplateModalOpen, setEditTemplateModalOpen] = useState(false);
  const [currentTemplateName, setCurrentTemplateName] = useState("");
  const [editedTemplateName, setEditedTemplateName] = useState("");

  const fetchData = async () => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.USER_BRANDING_DATA + uid,
        "GET"
      );
      if (result.success) {
        setTemplates(result.data.branding.branding_template);
      } else {
        enqueueSnackbar(result.data, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      console.log("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (event, pageName) => {
    const file = event.target.files[0];
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (
      file &&
      allowedTypes.includes(file.type) &&
      file.size <= 5 * 1024 * 1024
    ) {
      setSelectedFiles((prev) => ({ ...prev, [pageName]: file }));
    } else {
      setSelectedFiles((prev) => ({ ...prev, [pageName]: null }));
      enqueueSnackbar("File must be a DOCX and not exceed 5MB.", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };

  const handleUpload = async (pageName) => {
    const selectedFile = selectedFiles[pageName];
    if (!selectedFile) {
      enqueueSnackbar("No valid file selected.", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }

    try {
      setUploading((prev) => ({ ...prev, [pageName]: true }));
      const formData = new FormData();
      const extension = selectedFile.name.split(".").pop();
      formData.append("file", selectedFile, `${pageName}.${extension}`);
      formData.append("type", "templates");
      formData.append("pageName", pageName);

      await axios.put(`${BASE_URL}/s3/files/${uid}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      fetchData();
      enqueueSnackbar("File uploaded successfully", {
        variant: "success",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    } catch (error) {
      const data = error.response.data.message;
      enqueueSnackbar(data, {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    } finally {
      setUploading((prev) => ({ ...prev, [pageName]: false }));
    }
  };

  const getFileUrl = async (uid, pageName) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/s3/templates/${uid}/${pageName}`,
        { responseType: "blob" }
      );

      const fileReader = new FileReader();
      fileReader.readAsDataURL(response.data);

      return new Promise((resolve, reject) => {
        fileReader.onloadend = () => {
          resolve(fileReader.result);
        };
        fileReader.onerror = reject;
      });
    } catch (error) {
      console.error("Error fetching file:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchFileUrls = async () => {
      const urls = {};
      for (const template of templates) {
        const url = await getFileUrl(uid, template.page_name);
        urls[template.page_name] = url;
      }
      setFileUrls(urls);
    };
    fetchFileUrls();
  }, [templates]);

  const extractDelimitedText = (text) => {
    const regex = /\{\{\{([^{}]+)\}\}\}/g;
    const delimitedTexts = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      delimitedTexts.push(match[1]);
    }
    return delimitedTexts;
  };

  const handleGenerateJson = async (pageName) => {
    setLoading(true);
    const selectedFile = selectedFiles[pageName];
    if (!selectedFile) {
      enqueueSnackbar("No valid file selected.", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(`${BASE_URL}/doc_text`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const delimitedTexts = extractDelimitedText(response.data.text);
      const initialJsonData = delimitedTexts.reduce((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});
      setJsonData({ template_name: pageName, ...initialJsonData });
      setJsonModalOpen(true);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      enqueueSnackbar("Error extracting text from the file.", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard
      .writeText(JSON.stringify(jsonData, null, 2))
      .then(() => {
        setJsonCopySuccess(true);
        enqueueSnackbar("Copied To ClipBoard Successfully", {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        setTimeout(() => {
          setJsonCopySuccess(false);
        }, 3000);
      })
      .catch((error) => {
        console.error("Error copying JSON to clipboard:", error);
        enqueueSnackbar("Failed to copy JSON to clipboard", {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      });
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName) {
      enqueueSnackbar("Template name cannot be empty.", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/manage_templates`, {
        uid,
        page_name: newTemplateName,
        actionType: "add",
      });

      if (response.data.success) {
        enqueueSnackbar("Template added successfully", {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        fetchData();
        setAddTemplateModalOpen(false);
        setNewTemplateName("");
      } else {
        enqueueSnackbar(response.data.message, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      const data = error.response.data.message;
      enqueueSnackbar(`${data}`, {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };

  const handleEditTemplate = async () => {
    if (!editedTemplateName) {
      enqueueSnackbar("Template name cannot be empty.", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/manage_templates`, {
        uid,
        page_name: currentTemplateName,
        new_page_name: editedTemplateName,
        actionType: "edit",
      });

      if (response.data.success) {
        enqueueSnackbar("Template edited successfully", {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        fetchData();
        setEditTemplateModalOpen(false);
        setCurrentTemplateName("");
        setEditedTemplateName("");
      } else {
        enqueueSnackbar(response.data.message, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      const data = error.response.data.message;
      enqueueSnackbar(`${data}`, {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };

  const handleDeleteTemplate = async (templateName) => {
    try {
      const response = await axios.post(`${BASE_URL}/manage_templates`, {
        uid,
        page_name: templateName,
        actionType: "delete",
      });

      if (response.data.success) {
        enqueueSnackbar("Template deleted successfully", {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        fetchData();
      } else {
        enqueueSnackbar(response.data.message, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      enqueueSnackbar("Error deleting template", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };

  return (
    <>
      <Grid
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Grid>
          <Button
            style={{ marginLeft: "10px" }}
            onClick={() => setAddTemplateModalOpen(true)}
          >
            Add Template
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} key={template.page_name}>
            <Paper style={{ padding: "20px" }}>
              <Grid
                container
                alignItems="center"
                justifyContent="space-between"
              >
                <h3>{template.page_name}</h3>
                <Grid item>
                  <Edit
                    onClick={() => {
                      setCurrentTemplateName(template.page_name);
                      setEditedTemplateName(template.page_name);
                      setEditTemplateModalOpen(true);
                    }}
                    style={{ cursor: "pointer", marginRight: "10px" }}
                  />
                  <Delete
                    onClick={() => handleDeleteTemplate(template.page_name)}
                    style={{ cursor: "pointer" }}
                  />
                </Grid>
              </Grid>
              <input
                type="file"
                accept=".docx"
                onChange={(event) =>
                  handleFileChange(event, template.page_name)
                }
                style={{ marginTop: "15px" }}
              />
              {uploading[template.page_name] ? (
                <CircularProgress
                  size={20}
                  thickness={5}
                  style={{ marginTop: "10px", color: "black" }}
                />
              ) : (
                <Button
                  onClick={() => handleUpload(template.page_name)}
                  disabled={!selectedFiles[template.page_name]}
                >
                  Upload
                </Button>
              )}
              {selectedFiles[template.page_name] && (
                <Button
                  onClick={() => handleGenerateJson(template.page_name)}
                  style={{ marginLeft: "10px" }}
                >
                  Generate JSON
                </Button>
              )}
              <Grid>
                {fileUrls[template.page_name] && (
                  <a
                    href={fileUrls[template.page_name]}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: "10px",
                      textDecoration: "none",
                      color: "black",
                    }}
                  >
                    Download{" "}
                    <span style={{ color: "blue" }}>{template.page_name}</span>{" "}
                    File For Preview
                  </a>
                )}
              </Grid>
            </Paper>
          </Grid>
        ))}
        <Modal
          open={jsonModalOpen}
          onClose={() => setJsonModalOpen(false)}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              maxHeight: "80%",
              bgcolor: "background.paper",
              boxShadow: 24,
              borderRadius: 1,
              p: 2,
              overflow: "auto",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <h2 id="simple-modal-title">Extracted JSON</h2>
                <Button
                  onClick={handleCopyJson}
                  variant="contained"
                  color="primary"
                >
                  {jsonCopySuccess ? "Copied!" : "Copy"}
                </Button>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  overflowX: "auto",
                  overflowY: "auto",
                }}
              >
                <pre
                  id="simple-modal-description"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {Object.keys(jsonData).map((key) => (
                    <div key={key} style={{ whiteSpace: "nowrap" }}>
                      <strong>{key}</strong>: {jsonData[key]}
                    </div>
                  ))}
                </pre>
              </Box>
            </Box>
          </Box>
        </Modal>

        <Modal
          open={addTemplateModalOpen}
          onClose={() => {
            setAddTemplateModalOpen(false);
            setNewTemplateName(""); // Clear newTemplateName when closing modal
          }}
          aria-labelledby="add-template-modal-title"
          aria-describedby="add-template-modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              borderRadius: 1,
              p: 4,
            }}
          >
            <h2 id="add-template-modal-title">Add New Template</h2>
            <TextField
              fullWidth
              label="Template Name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveTemplate}
            >
              Save
            </Button>
          </Box>
        </Modal>

        <Modal
          open={editTemplateModalOpen}
          onClose={() => setEditTemplateModalOpen(false)}
          aria-labelledby="edit-template-modal-title"
          aria-describedby="edit-template-modal-description"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              borderRadius: 1,
              p: 4,
            }}
          >
            <h2 id="edit-template-modal-title">Edit Template</h2>
            <TextField
              fullWidth
              label="Template Name"
              value={editedTemplateName}
              onChange={(e) => setEditedTemplateName(e.target.value)}
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleEditTemplate}
            >
              Save Changes
            </Button>
          </Box>
        </Modal>

        {loading && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 9999999,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0, 0, 0, 0.75)",
                zIndex: 9999999,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 9999999,
              }}
            >
              <PushSpinner size={30} thickness={5} color="white" />
            </div>
          </div>
        )}
      </Grid>
    </>
  );
};

export default TemplateUpload;
