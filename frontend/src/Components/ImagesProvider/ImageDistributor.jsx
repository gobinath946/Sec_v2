import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../config";
import CircularProgress from "@mui/material/CircularProgress";
import { Grid } from "@mui/material";


const ImageDistributor = ({ uid, logo, width, height,borderRadius=null }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImageUrl = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/s3/files/${uid}/${logo}`,
          { responseType: "blob" }
        );

        const fileReader = new FileReader();
        fileReader.readAsDataURL(response.data);

        fileReader.onloadend = () => {
          setImageUrl(fileReader.result);
          setLoading(false);
        };
      } catch (error) {
        console.error("Error fetching image:", error);
        setLoading(true);
      }
    };

    fetchImageUrl();
  }, [uid, logo]);

  return (
    <>
      {loading ? (
        <Grid sx={{marginTop:"10px"}}>
          <CircularProgress
            size={20}
            thickness={5}
            style={{ color: "black" }}
          />
        </Grid>
      ) : (
        <img
          src={imageUrl}
          alt={logo}
          style={{ width: width, height: height,borderRadius:borderRadius}}
        />
      )}
    </>
  );
};

export default ImageDistributor;
