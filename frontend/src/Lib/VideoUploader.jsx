import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
} from "@mui/material";
import { CloudUpload, Delete, Upload, Cancel } from "@mui/icons-material";
import axios from "axios";
import io from "socket.io-client";
import { BASE_URL } from "../config";

const MAX_FILE_SIZE = 300 * 1024 * 1024;

const VideoUploader = ({
  onVideosChange,
  id,
  rec_email,
  rec_mobile,
  cus_id,
  rec_name,
}) => {
  const [videos, setVideos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BASE_URL, {
      path: "/api/user/viedo_upload",
    });

    socketRef.current = socket;

    socket.on("uploadProgress", ({ fileName, progress }) => {
      setUploadProgress((prev) => ({ ...prev, [fileName]: progress }));
    });

    socket.on("uploadComplete", ({ fileName }) => {
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.name === fileName ? { ...v, uploaded: true, uploading: false } : v
        )
      );
    });

    socket.on("uploadError", ({ fileName, error }) => {
      console.error(`Error uploading ${fileName}:`, error);
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.name === fileName ? { ...v, uploading: false, error: true } : v
        )
      );
    });

    socket.on("uploadCancelled", ({ fileName }) => {
      setVideos((prevVideos) => prevVideos.filter((v) => v.name !== fileName));
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleFileChange = (event) => {
    const newVideos = Array.from(event.target.files)
      .filter((file) => file.size <= MAX_FILE_SIZE) // Filter out files larger than 300MB
      .map((file) => ({
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        uploaded: false,
        uploading: false,
        error: false,
      }));

    // Notify the user if a file was too large
    if (newVideos.length < event.target.files.length) {
      alert(
        "Some files were not added because they exceed the 300MB size limit."
      );
    }

    setVideos((prevVideos) => [...prevVideos, ...newVideos]);
    onVideosChange([...videos, ...newVideos]); // Ensure you're passing the updated `videos`
  };

  const uploadToDropbox = useCallback(async (video) => {
    const msg_id = sessionStorage.getItem("uid");
    const formData = new FormData();
    formData.append("file", video.file);
    formData.append("socketId", socketRef.current.id);
    formData.append("msg_id", msg_id);
    formData.append("message_id", id);
    formData.append("action", "SGauto_Link");
    formData.append("service", "Dropbox");

    try {
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.name === video.name ? { ...v, uploading: true, error: false } : v
        )
      );

      await axios.post(`${BASE_URL}/api/upload-to-dropbox/${cus_id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      console.error("Error uploading to Dropbox:", error);
      setVideos((prevVideos) =>
        prevVideos.map((v) =>
          v.name === video.name ? { ...v, uploading: false, error: true } : v
        )
      );
    }
  }, []);

  const handleRemoveVideo = async (videoName) => {
    const video = videos.find((v) => v.name === videoName);
    if (video.uploaded) {
      try {
        await axios.delete(`${BASE_URL}/api/delete-from-dropbox/${videoName}`);
      } catch (error) {
        console.error("Error deleting from Dropbox:", error);
      }
    }
    setVideos((prev) => prev.filter((v) => v.name !== videoName));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[videoName];
      return newProgress;
    });
  };

  const handleCancelUpload = (videoName) => {
    socketRef.current.emit("cancelUpload", videoName);
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[videoName];
      return newProgress;
    });
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <Button
        variant="contained"
        onClick={() => fileInputRef.current.click()}
        sx={{ marginTop: "12px" }}
      >
        Videos Section
      </Button>

      <List sx={{ marginTop: "10px" }}>
        {videos.map((video, index) => (
          <ListItem key={index} divider>
            <ListItemText
              primary={video.name}
              secondary={
                video.uploading
                  ? `Uploading... ${uploadProgress[video.name] || 0}%`
                  : video.uploaded
                  ? "Uploaded"
                  : video.error
                  ? "Upload failed"
                  : null
              }
            />
            <ListItemSecondaryAction>
              {!video.uploaded && !video.uploading && (
                <IconButton
                  onClick={() => uploadToDropbox(video)}
                  color="primary"
                >
                  <CloudUpload />
                </IconButton>
              )}
              {video.uploading && (
                <IconButton
                  onClick={() => handleCancelUpload(video.name)}
                  color="secondary"
                >
                  <Cancel />
                </IconButton>
              )}
              <IconButton
                onClick={() => handleRemoveVideo(video.name)}
                color="error"
              >
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default VideoUploader;
