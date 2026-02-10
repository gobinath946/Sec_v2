import React, { useState, useEffect } from "react";
import axios from "axios";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "notistack";

import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";
import { BASE_URL } from "../../../config";

const LogoBranding = ({ uid }) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [pageLogos, setPageLogos] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [uploading, setUploading] = useState({});
  const { enqueueSnackbar } = useSnackbar();

  const fetchData = async () => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.USER_BRANDING_DATA + uid,
        "GET"
      );
      if (result.success) {
        setPageLogos(result.data.branding.branding_logo);
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
      console.log("Error fetching logos:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (event, pageName) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png") && file.size <= 2 * 1024 * 1024) {
      setSelectedFiles((prev) => ({ ...prev, [pageName]: file }));
    } else {
      setSelectedFiles((prev) => ({ ...prev, [pageName]: null }));
      enqueueSnackbar("File must be JPG or PNG and not exceed 2MB.", {
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
      formData.append("image", selectedFile, `${pageName}.${extension}`);
      formData.append("type", "assets");
      formData.append("pageName", pageName);

      await axios.put(
        `${BASE_URL}/s3/files/${uid}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      fetchData();
      enqueueSnackbar("Image uploaded successfully", {
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

  const getImageUrl = async (uid, pageName) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/s3/files/${uid}/${pageName}`,
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
      console.error("Error fetching image:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchImageUrls = async () => {
      const urls = {};
      for (const logo of pageLogos) {
        const url = await getImageUrl(uid, logo.page_name);
        urls[logo.page_name] = url;
      }
      setImageUrls(urls);
    };
    fetchImageUrls();
  }, [pageLogos]);

  return (
    <Grid container spacing={3}>
      {pageLogos.map((logo) => (
        <Grid item xs={12} key={logo.page_name}>
          <Paper style={{ padding: "20px" }}>
            <h3>{logo.page_name}</h3>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => handleFileChange(event, logo.page_name)}
              style={{ marginTop: "15px" }}
            />
            {uploading[logo.page_name] ? (
              <CircularProgress
                size={20}
                thickness={5}
                style={{ marginTop: "10px", color: "black" }}
              />
            ) : (
              <Button 
                onClick={() => handleUpload(logo.page_name)}
                disabled={!selectedFiles[logo.page_name]}
              >
                Upload
              </Button>
            )}
            <Grid>
              {imageUrls[logo.page_name] && (
                <img
                  src={imageUrls[logo.page_name]}
                  alt={logo.page_name}
                  style={{ maxWidth: "200px", marginTop: "10px" }}
                />
              )}
            </Grid>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default LogoBranding;
