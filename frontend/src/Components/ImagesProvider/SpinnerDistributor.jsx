import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../config";
const SpinnerDistributor = ({ uid, logo, style }) => {
  const [imageUrl, setImageUrl] = useState(null);

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
        };
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    };

    fetchImageUrl();
  }, [uid, logo]);

  return (
    <>
      <img src={imageUrl} alt={logo} style={{ ...style }} />
    </>
  );
};

export default SpinnerDistributor;
