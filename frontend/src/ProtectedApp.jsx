import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { useSnackbar } from "notistack";

const ProtectedApp = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showNotification = (message, variant = "error") => {
    enqueueSnackbar(message, {
      variant,
      preventDuplicate: true,
    });
  };

  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      showNotification("Right-click is disabled!", "warning");
      return false;
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      // Disable F12 (Developer Tools)
      if (e.key === "F12") {
        e.preventDefault();
        showNotification("Developer tools access is not allowed!", "error");
        return false;
      }

      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        showNotification("Developer tools access is not allowed!", "error");
        return false;
      }

      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        showNotification("Console access is not allowed!", "error");
        return false;
      }

      // Disable Ctrl+Shift+C (Element Inspector)
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        showNotification("Element inspector is not allowed!", "error");
        return false;
      }

      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        showNotification("View source is not allowed!", "warning");
        return false;
      }

      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        showNotification("Save page is not allowed!", "warning");
        return false;
      }

      // Disable Ctrl+A (Select All)
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        showNotification("Select all is not allowed!", "info");
        return false;
      }

      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        showNotification("Print is not allowed!", "warning");
        return false;
      }

      // Disable Ctrl+C (Copy)
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        showNotification("Copy is not allowed!", "info");
        return false;
      }

      // Disable Ctrl+V (Paste)
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        showNotification("Paste is not allowed!", "info");
        return false;
      }

      // Disable Ctrl+X (Cut)
      if (e.ctrlKey && e.key === "x") {
        e.preventDefault();
        showNotification("Cut is not allowed!", "info");
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
    //   showNotification("Text selection is not allowed!", "info");
      return false;
    };

    // Disable drag and drop
    const handleDragStart = (e) => {
      e.preventDefault();
      showNotification("Drag and drop is not allowed!", "warning");
      return false;
    };

    // Add event listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);

    // Disable developer tools detection (basic)
    const detectDevTools = () => {
      const threshold = 160;
      const interval = setInterval(() => {
        if (
          window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold
        ) {
          showNotification("Developer tools detected and blocked!", "error");
        }
      }, 500);

      return () => clearInterval(interval);
    };

    const cleanupDetection = detectDevTools();

    // Cleanup event listeners
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
      cleanupDetection();
    };
  }, [enqueueSnackbar]);


  return (
    <Box
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 10,
          background: "transparent",
          userSelect: "none",
        }}
      />
    </Box>
  );
};

export default ProtectedApp;
