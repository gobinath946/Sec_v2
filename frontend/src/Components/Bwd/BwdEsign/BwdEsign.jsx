import React, { useRef, useState } from "react";
import { Button, TextField, Grid, Typography, IconButton } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  Link,
  Card,
  TableRow,
  Paper,
  Box,
  Modal,
  useTheme,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { RotateSpinner } from "react-spinners-kit";
import { useParams } from "react-router-dom";
import {
  Add as AddIcon,
  RemoveCircle as RemoveCircleIcon,
} from "@mui/icons-material";

import SignaturePad from "../../../Lib/SignaturePad";
import logo from "./FormAssets/bwd_logo.jpg";
import { useSnackbar } from "notistack";
import { BASE_URL } from "../../../config";
import { poppinsRegularBase64 } from "../../../Lib/Signature_Fonts/Base64/poppins";
import ImageDistributor from "../../ImagesProvider/ImageDistributor";

const generateServiceOrderPDF = async (
  RentalListingData,
  signatureData,
  signatures,
  is_readable,
  cus_id,
  rec_name
) => {
  // Create PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Add custom fonts
  doc.addFileToVFS("Poppins-Regular.ttf", poppinsRegularBase64);
  doc.addFont("Poppins-Regular.ttf", "Poppins", "normal");
  doc.setFont("Poppins");

  // Set up dimensions
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  let currentY = 0;
  let pageNumber = 1;

  const SECTION_TOP_MARGIN = 8;
  const SUBSECTION_TOP_MARGIN = 6;
  const PARAGRAPH_BOTTOM_MARGIN = 6;
  const HEADING_BOTTOM_MARGIN = 2;

  const addHeader = () => {
    currentY = margin;
    const logoWidth = 40;
    const logoHeight = 18;
    doc.addImage(logo, "PNG", margin, currentY, logoWidth, logoHeight);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const leftDetails = [
      // "BW Digital",
      // "Auckland, New Zealand",
      // "Mobile: +64 21 756 166",
    ];
    const rightDetails = [
      `Date: ${
        RentalListingData?.Bwd_Esign?.service_order_date ||
        new Date().toLocaleDateString()
      }`,
      "www.bw-digital.com",
      `Service Order Number: ${
        RentalListingData?.Bwd_Esign?.service_order_number || ""
      }`,
      ` Internal Reference Number: ${
        RentalListingData?.Bwd_Esign?.service_order_reference_number || ""
      }`,
    ];
    let detailY = currentY;
    leftDetails.forEach((line) => {
      doc.text(line, margin + logoWidth + 10, detailY + 5);
      detailY += 5;
    });
    detailY = currentY;
    rightDetails.forEach((line) => {
      doc.text(line, pageWidth - margin, detailY + 5, { align: "right" });
      detailY += 5;
    });
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 25, pageWidth - margin, currentY + 25);
    currentY += 30;
    return currentY;
  };

  // Function to add footer to each page
  const addFooter = (pageNumber) => {
    const footerY = pageHeight - 15;

    // Add logo to left side of footer
    const footerLogoWidth = 25;
    const footerLogoHeight = 10;
    doc.addImage(
      logo,
      "PNG",
      margin,
      footerY,
      footerLogoWidth,
      footerLogoHeight
    );

    // Add page number to center
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${pageNumber}`, pageWidth / 2, footerY + 5, {
      align: "center",
    });

    // Add date on right side
    const currentDate = new Date().toLocaleDateString();
    doc.text(currentDate, pageWidth - margin, footerY + 5, { align: "right" });
  };

  // Function to check if we need to add a new page
  const checkPageBreak = (requiredSpace) => {
    if (currentY + requiredSpace >= pageHeight - 20) {
      addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      return addHeader();
    }
    return currentY;
  };
  currentY = addHeader();
  doc.setFontSize(16);
  doc.setFont("Poppins", "bold");
  currentY += 5;
  doc.setTextColor(60, 66, 129); // #3c4281 color
  doc.text(
    RentalListingData?.Bwd_Esign?.documentTitle || "Service Order Form",
    pageWidth / 2,
    currentY,
    {
      align: "center",
    }
  );
  currentY += 5;
  const addSectionHeader = (sectionNumber, sectionTitle) => {
    // Add proper spacing before section headers
    currentY += SECTION_TOP_MARGIN;
    currentY = checkPageBreak(15);

    doc.setFontSize(12);
    doc.setFont("Poppins", "bold");
    doc.setTextColor(51, 51, 51); // #333333
    const title = `${sectionNumber}. ${sectionTitle}`;
    doc.text(title, margin, currentY);

    // Add space after heading
    currentY += HEADING_BOTTOM_MARGIN;

    return currentY;
  };

  // Improved function to add a table with proper page breaks and alignment
  const addTable = (table) => {
    if (!table || !table.rows || table.rows.length === 0) return currentY;

    // Add a small gap before table
    currentY += 3;

    const rowHeight = 10; // Increased row height for better readability
    const cellPadding = 2;
    const tableWidth = usableWidth;
    const colWidth = [tableWidth * 0.35, tableWidth * 0.65];

    // Check if at least one row fits on current page
    if (currentY + rowHeight > pageHeight - 20) {
      addFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      currentY = addHeader();
    }

    // Draw header row only once
    const headerRowHeight = 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, tableWidth, headerRowHeight, "F");

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, margin + tableWidth, currentY); // Top border
    doc.line(
      margin,
      currentY + headerRowHeight,
      margin + tableWidth,
      currentY + headerRowHeight
    ); // Bottom border
    doc.line(margin, currentY, margin, currentY + headerRowHeight); // Left border
    doc.line(
      margin + colWidth[0],
      currentY,
      margin + colWidth[0],
      currentY + headerRowHeight
    ); // Middle border
    doc.line(
      margin + tableWidth,
      currentY,
      margin + tableWidth,
      currentY + headerRowHeight
    ); // Right border

    doc.setFontSize(9);
    doc.setFont("Poppins", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Field", margin + cellPadding, currentY + headerRowHeight / 2, {
      baseline: "middle",
    });
    doc.text(
      "Value",
      margin + colWidth[0] + cellPadding,
      currentY + headerRowHeight / 2,
      { baseline: "middle" }
    );

    currentY += headerRowHeight;

    // Process all rows
    for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
      const row = table.rows[rowIndex];

      // Calculate content height first
      doc.setFontSize(9);
      doc.setFont("Poppins", "normal");

      // Get value text split into lines
      const valueText = row.value || "N/A";
      const maxWidth = colWidth[1] - cellPadding * 2;
      const splitValue = doc.splitTextToSize(valueText, maxWidth);

      // Calculate how many lines of text we have
      const textLines = splitValue.length;
      const textHeight = textLines * (doc.getTextDimensions("Test").h * 1.2);
      const contentRowHeight = Math.max(
        rowHeight,
        textHeight + cellPadding * 2
      );

      // Check if this row fits on current page
      if (currentY + contentRowHeight > pageHeight - 20) {
        // Draw bottom border for the last row on current page
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(margin, currentY, margin + tableWidth, currentY);

        // Add footer and start new page
        addFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        currentY = addHeader();

        // Draw header again on the new page for table continuation
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, currentY, tableWidth, headerRowHeight, "F");

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.line(margin, currentY, margin + tableWidth, currentY); // Top border
        doc.line(
          margin,
          currentY + headerRowHeight,
          margin + tableWidth,
          currentY + headerRowHeight
        ); // Bottom border
        doc.line(margin, currentY, margin, currentY + headerRowHeight); // Left border
        doc.line(
          margin + colWidth[0],
          currentY,
          margin + colWidth[0],
          currentY + headerRowHeight
        ); // Middle border
        doc.line(
          margin + tableWidth,
          currentY,
          margin + tableWidth,
          currentY + headerRowHeight
        ); // Right border

        doc.setFontSize(9);
        doc.setFont("Poppins", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(
          "Field (continued)",
          margin + cellPadding,
          currentY + headerRowHeight / 2,
          { baseline: "middle" }
        );
        doc.text(
          "Value",
          margin + colWidth[0] + cellPadding,
          currentY + headerRowHeight / 2,
          { baseline: "middle" }
        );

        currentY += headerRowHeight;
      }

      // Set background color for alternating rows
      if (rowIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
      } else {
        doc.setFillColor(245, 245, 245);
      }

      // Draw cell background
      doc.rect(margin, currentY, tableWidth, contentRowHeight, "F");

      // Draw cell borders
      doc.setDrawColor(224, 224, 224);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY, margin + tableWidth, currentY); // Top border
      doc.line(
        margin,
        currentY + contentRowHeight,
        margin + tableWidth,
        currentY + contentRowHeight
      ); // Bottom border
      doc.line(margin, currentY, margin, currentY + contentRowHeight); // Left border
      doc.line(
        margin + colWidth[0],
        currentY,
        margin + colWidth[0],
        currentY + contentRowHeight
      ); // Middle border
      doc.line(
        margin + tableWidth,
        currentY,
        margin + tableWidth,
        currentY + contentRowHeight
      ); // Right border

      // Add field name
      doc.setFontSize(9);
      doc.setFont("Poppins", "bold");
      doc.setTextColor(80, 80, 80);

      let fieldX = margin + cellPadding;
      // Add row ID if exists
      if (row.id) {
        // Draw circle with ID
        doc.setFillColor(33, 150, 243);
        const circleRadius = 2;
        const circleX = fieldX + circleRadius;
        const circleY = currentY + contentRowHeight / 2;

        doc.circle(circleX, circleY, circleRadius, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(row.id, circleX, circleY + 0.5, {
          align: "center",
          baseline: "middle",
        });

        fieldX += circleRadius * 2 + 3;
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);
      }

      // Text for field
      const fieldText = row.field || "";
      const splitField = doc.splitTextToSize(
        fieldText,
        colWidth[0] - cellPadding * 2 - (row.id ? 5 : 0)
      );
      doc.text(splitField, fieldX, currentY + contentRowHeight / 2, {
        baseline: "middle",
      });

      // Add value
      doc.setFont("Poppins", "normal");
      doc.setTextColor(60, 60, 60);

      if (splitValue.length > 1) {
        // For multi-line text, position at top with padding
        doc.text(
          splitValue,
          margin + colWidth[0] + cellPadding,
          currentY + cellPadding + 2
        );
      } else {
        // For single line text, center vertically
        doc.text(
          splitValue,
          margin + colWidth[0] + cellPadding,
          currentY + contentRowHeight / 2,
          { baseline: "middle" }
        );
      }

      currentY += contentRowHeight;
    }

    return currentY + 5;
  };

  // Function to add text paragraphs
  const addParagraph = (
    text,
    fontSize = 9,
    isItalic = false,
    isBold = false
  ) => {
    if (!text) return currentY;

    // Add small spacing before paragraph
    currentY += 3;
    currentY = checkPageBreak(15);

    doc.setFontSize(fontSize);

    if (isBold) {
      doc.setFont("Poppins", "bold");
    } else {
      doc.setFont("Poppins", "normal");
    }

    if (isItalic) {
      doc.setTextColor(100, 100, 100);
    } else {
      doc.setTextColor(85, 85, 85);
    }

    const splitText = doc.splitTextToSize(text, usableWidth);
    doc.text(splitText, margin, currentY);

    // Calculate height based on number of lines
    const textHeight = doc.getTextDimensions(splitText).h * 1.2;
    currentY += textHeight;

    return currentY + PARAGRAPH_BOTTOM_MARGIN; // Increased from 3 to 8
  };

  const addHtmlContent = (htmlContent) => {
    if (!htmlContent) return currentY;

    currentY += 3;
    currentY = checkPageBreak(15);

    const element = document.createElement("div");
    element.innerHTML = htmlContent;

    // Default text settings
    const defaultSettings = {
      font: "normal",
      size: 9,
      color: [0, 0, 0], // Black
    };

    // Save initial text settings
    const initialFont = doc.getFont();
    const initialFontSize = doc.getFontSize();
    const initialTextColor = doc.getTextColor();

    const renderNode = (
      node,
      indent = 0,
      settings = { ...defaultSettings }
    ) => {
      // Skip empty text nodes and comments
      if (node.nodeType === 3 && node.textContent.trim() === "") return;
      if (node.nodeType === 8) return;

      // Apply current settings
      doc.setFont("Poppins", settings.font);
      doc.setFontSize(settings.size);
      doc.setTextColor(...settings.color);

      // Text node handling
      if (node.nodeType === 3) {
        const text = node.textContent.trim();
        if (text) {
          currentY = checkPageBreak(10);
          const splitText = doc.splitTextToSize(text, usableWidth - indent);
          doc.text(splitText, margin + indent, currentY);
          const textHeight = doc.getTextDimensions(splitText).h * 1.2;
          currentY += textHeight;
        }
        return;
      }

      // Element node handling
      if (node.nodeType === 1) {
        const tagName = node.tagName.toLowerCase();

        // Create a new settings object for this element
        const newSettings = { ...settings };

        switch (tagName) {
          case "h1":
            newSettings.size = 16;
            newSettings.color = [51, 51, 51]; // #333333
            break;
          case "h2":
            newSettings.size = 14;
            newSettings.color = [51, 51, 51]; // #333333
            break;
          case "h3":
          case "h4":
          case "h5":
          case "h6":
            newSettings.size = 12;
            newSettings.color = [51, 51, 51]; // #333333
            break;
          case "b":
          case "strong":
            newSettings.font = "bold";
            break;
          case "i":
          case "em":
            newSettings.font = "italic";
            newSettings.color = [100, 100, 100]; // Gray
            break;
          case "a":
            newSettings.color = [60, 66, 129]; // #3c4281 color
            break;
          case "ul":
          case "ol":
            currentY += 2;
            break;
          case "li":
            currentY = checkPageBreak(10);
            if (node.parentNode.tagName.toLowerCase() === "ul") {
              doc.text("•", margin + indent, currentY);
              indent += 5;
            } else if (node.parentNode.tagName.toLowerCase() === "ol") {
              const index =
                Array.from(node.parentNode.children).indexOf(node) + 1;
              doc.text(`${index}.`, margin + indent, currentY);
              indent += 7;
            }
            break;
          case "br":
            currentY += doc.getTextDimensions("Test").h * 1.2;
            currentY = checkPageBreak(10);
            return;
          case "p":
            currentY = checkPageBreak(15);
            if (currentY > margin) currentY += PARAGRAPH_BOTTOM_MARGIN;
            break;
          case "hr":
            currentY = checkPageBreak(10);
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 5;
            return;
          case "table":
            currentY = checkPageBreak(20);
            doc.setFontSize(9);
            doc.setFont("Poppins", "italic");
            doc.setTextColor(100, 100, 100);
            doc.text(
              "[Table content - use addTable() function instead]",
              margin + indent,
              currentY
            );
            currentY += doc.getTextDimensions("Test").h * 1.2;
            currentY += 5;
            return;
        }

        // Handle single text node differently for better performance
        if (node.childNodes.length === 1 && node.firstChild.nodeType === 3) {
          const text = node.textContent.trim();
          if (text) {
            // Apply the new settings
            doc.setFont("Poppins", newSettings.font);
            doc.setFontSize(newSettings.size);
            doc.setTextColor(...newSettings.color);

            currentY = checkPageBreak(10);
            const splitText = doc.splitTextToSize(text, usableWidth - indent);
            doc.text(splitText, margin + indent, currentY);
            const textHeight = doc.getTextDimensions(splitText).h * 1.2;
            currentY += textHeight;

            if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
              currentY += HEADING_BOTTOM_MARGIN;
            }
          }
        } else {
          // Recursively render child nodes with new settings
          for (const child of node.childNodes) {
            renderNode(child, indent, newSettings);
          }

          if (["p", "ul", "ol"].includes(tagName)) {
            currentY += PARAGRAPH_BOTTOM_MARGIN;
          } else if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
            currentY += HEADING_BOTTOM_MARGIN;
          }
        }
      }
    };

    // Process all root elements
    for (const child of element.childNodes) {
      renderNode(child);
    }

    // Restore original settings
    doc.setFont(initialFont.fontName, initialFont.fontStyle);
    doc.setFontSize(initialFontSize);
    doc.setTextColor(initialTextColor);

    return currentY + PARAGRAPH_BOTTOM_MARGIN;
  };

  // Function to add a subsection
  const addSubsection = (subsection) => {
    if (!subsection) return currentY;

    // Add spacing before subsection
    currentY += SUBSECTION_TOP_MARGIN;
    currentY = checkPageBreak(15);

    // Add subsection title if exists
    if (subsection.title) {
      doc.setFontSize(10);
      doc.setFont("Poppins", "bold");
      doc.setTextColor(51, 51, 51);
      doc.text(subsection.title, margin, currentY);
      currentY += 6;
    }

    // Add subsection ID and text if exists
    if (subsection.id && subsection.text) {
      doc.setFontSize(9);
      doc.setFont("Poppins", "normal");
      doc.setTextColor(85, 85, 85);

      const idWidth = 5;
      doc.setFont("Poppins", "bold");
      doc.text(`${subsection.id})`, margin, currentY);
      doc.setFont("Poppins", "normal");

      const text = subsection.text;
      const splitText = doc.splitTextToSize(text, usableWidth - idWidth);
      doc.text(splitText, margin + idWidth, currentY);

      const textHeight = doc.getTextDimensions(splitText).h * 1.2;
      currentY += textHeight;
    } else if (subsection.text) {
      currentY = addParagraph(subsection.text);
    }

    // Add additional text if exists
    if (subsection.additionalText) {
      currentY = addParagraph(subsection.additionalText, 9, true);
    }

    // Process paragraphs if they exist
    if (subsection.paragraphs) {
      subsection.paragraphs.forEach((para) => {
        if (typeof para === "string") {
          currentY = addParagraph(para);
        } else if (para.list) {
          currentY = addList(para.list);
        } else if (para.definitions) {
          currentY = addDefinitions(para.definitions);
        }
      });
    }

    // Process lists if they exist
    if (subsection.list) {
      currentY = addList(subsection.list);
    }

    // Process definitions if they exist
    if (subsection.definitions) {
      currentY = addDefinitions(subsection.definitions);
    }

    return currentY;
  };

  // Function to add a list
  const addList = (list) => {
    if (!list) return currentY;

    // Add a small gap before list
    currentY += 3;
    currentY = checkPageBreak(10);

    const listIndent = 5;
    const idWidth = 5;

    list.forEach((item) => {
      // Check if this item might need to start on a new page
      const itemHeight = 15; // Estimated minimum height for a list item
      currentY = checkPageBreak(itemHeight);

      doc.setFontSize(9);
      doc.setFont("Poppins", "bold");
      doc.setTextColor(51, 51, 51);
      doc.text(`${item.id})`, margin + listIndent, currentY);

      doc.setFont("Poppins", "normal");
      doc.setTextColor(85, 85, 85);

      const splitText = doc.splitTextToSize(
        item.text,
        usableWidth - listIndent - idWidth
      );
      doc.text(splitText, margin + listIndent + idWidth, currentY);

      const textHeight = doc.getTextDimensions(splitText).h * 1.2;
      currentY += textHeight + 3;
    });

    return currentY + 2; // Add a little extra space after lists
  };

  // Function to add definitions
  const addDefinitions = (definitions) => {
    if (!definitions) return currentY;

    // Add a small gap before definitions
    currentY += 3;
    currentY = checkPageBreak(10);

    let definitionStartY = currentY;
    let totalDefinitionHeight = 0;

    // Calculate total height first
    definitions.forEach((def) => {
      doc.setFontSize(9);
      doc.setFont("Poppins", "bold");

      const termWidth = doc.getTextWidth(`${def.term}: `);

      doc.setFont("Poppins", "normal");

      const splitDefinition = doc.splitTextToSize(
        def.definition,
        usableWidth - 10 - termWidth
      );
      const textHeight = doc.getTextDimensions(splitDefinition).h * 1.2;

      totalDefinitionHeight += textHeight + 3;
    });

    // Add background for all definitions
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(
      margin,
      definitionStartY,
      usableWidth,
      totalDefinitionHeight + 10,
      3,
      3,
      "F"
    );

    currentY += 8; // Space from top of background

    definitions.forEach((def) => {
      // Check if this definition might need to start on a new page
      const definitionHeight = 15; // Estimated minimum height
      currentY = checkPageBreak(definitionHeight);

      doc.setFontSize(9);
      doc.setFont("Poppins", "bold");
      doc.setTextColor(51, 51, 51);

      const termWidth = doc.getTextWidth(`${def.term}: `);
      doc.text(`${def.term}:`, margin + 5, currentY);

      doc.setFont("Poppins", "normal");
      doc.setTextColor(85, 85, 85);

      const splitDefinition = doc.splitTextToSize(
        def.definition,
        usableWidth - 10 - termWidth
      );
      doc.text(splitDefinition, margin + 5 + termWidth, currentY);

      const textHeight = doc.getTextDimensions(splitDefinition).h * 1.2;
      currentY += textHeight + 3;
    });

    return currentY + 3;
  };


    const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${formattedDate}, ${formattedTime}`;
  };

  const addServiceDiagrams = async (diagrams) => {
    if (!diagrams || !Array.isArray(diagrams)) return currentY;

    currentY += 5;

    const diagramHeight = 60;
    const captionHeight = 10;
    const diagramsPerRow = 2;
    const rows = Math.ceil(diagrams.length / diagramsPerRow);
    const totalHeight = rows * (diagramHeight + captionHeight) + 10;

    currentY = checkPageBreak(totalHeight);

    const diagramWidth = usableWidth / diagramsPerRow - 5;
    let rowY = currentY;
    for (let index = 0; index < diagrams.length; index++) {
      const diagram = diagrams[index];
      const col = index % diagramsPerRow;
      const diagramX = margin + col * (diagramWidth + 10);
      if (col === 0 && index > 0) {
        rowY += diagramHeight + captionHeight + 5;
        if (rowY + diagramHeight + captionHeight > pageHeight - 20) {
          addFooter(pageNumber);
          doc.addPage();
          pageNumber++;
          rowY = addHeader();
        }
      }

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(diagramX, rowY, diagramWidth, diagramHeight, 2, 2, "F");

      if (diagram.url) {
        try {
          const proxyUrl = `${BASE_URL}/api/proxy/image?url=${encodeURIComponent(
            diagram.url
          )}`;
          doc.addImage(
            proxyUrl,
            "JPEG", // This is a fallback format, jsPDF will detect actual format
            diagramX + 2, // Add small padding
            rowY + 2,
            diagramWidth - 4, // Account for padding
            diagramHeight - 4
          );
        } catch (error) {
          console.error("Failed to add image:", error);
          doc.setFillColor(235, 235, 235);
          doc.rect(diagramX, rowY, diagramWidth, diagramHeight, "F");
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            "Image not available",
            diagramX + diagramWidth / 2,
            rowY + diagramHeight / 2,
            {
              align: "center",
              baseline: "middle",
            }
          );
        }
      } else {
        // No image URL provided
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "No image",
          diagramX + diagramWidth / 2,
          rowY + diagramHeight / 2,
          {
            align: "center",
            baseline: "middle",
          }
        );
      }

      // Add caption
      doc.setFontSize(9);
      doc.setFont("Poppins", "normal");
      doc.setTextColor(85, 85, 85);
      doc.text(
        diagram.name || "Untitled",
        diagramX + diagramWidth / 2,
        rowY + diagramHeight + captionHeight,
        { align: "center" }
      );
    }

    return rowY + diagramHeight + captionHeight + 10;
  };

  const addSignatures = async () => {
    currentY += SECTION_TOP_MARGIN;
    currentY = checkPageBreak(40);
    doc.setFontSize(12);
    doc.setFont("Poppins", "bold");
    doc.setTextColor(51, 51, 51);
    doc.text("Signatures", margin, currentY);
    currentY += 8;

    // Signature labels
    doc.setFontSize(10);
    doc.text("Company Signature:", margin, currentY);
    doc.text("Other Signatures:", margin + usableWidth / 2, currentY);
    currentY += 5;

    // REDUCED signature block dimensions
    const signatureWidth = 40; // Reduced from 70 to 40
    const signatureHeight = 20; // Reduced from 30 to 20
    const signatureGap = 10;
    const borderWidth = 0.3;
    const borderColor = [220, 220, 220];
    const borderRadius = 2;

    // Add supplier/vendor signature on the left
    doc.setLineWidth(borderWidth);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(
      margin,
      currentY,
      signatureWidth,
      signatureHeight,
      borderRadius,
      borderRadius
    );

    // Add logo as a placeholder for vendor signature - scaled down for smaller box
    const logoScale = 0.5; // Reduced from 0.7 to 0.5
    doc.addImage(
      logo,
      "PNG",
      margin + (signatureWidth - 40 * logoScale) / 2,
      currentY + (signatureHeight - 18 * logoScale) / 2,
      40 * logoScale,
      18 * logoScale
    );

    // Add date for vendor signature
    doc.setFontSize(8);
    doc.setFont("Poppins", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      formatDate(new Date()),
      margin + signatureWidth / 2,
      currentY + signatureHeight + 5,
      { align: "center" }
    );

    // Combine all client signatures
    const validSignatures = Array.isArray(signatures) ? signatures : [];
    const validSignaturesData = Array.isArray(signatureData)
      ? signatureData
      : [];
    const combinedSignatures = [
      ...validSignatures,
      ...validSignaturesData,
    ].filter((sig) => sig && sig.data);

    // Sort signatures by date if available
    const sortedSignatures = combinedSignatures.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

    // Client signatures area on the right side
    let clientSignatureY = currentY;

    if (sortedSignatures.length === 0) {
      // Empty signature box if no signatures
      doc.roundedRect(
        margin + usableWidth / 2,
        clientSignatureY,
        signatureWidth,
        signatureHeight,
        borderRadius,
        borderRadius
      );

      // Add placeholder text
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        "Awaiting signature",
        margin + usableWidth / 2 + signatureWidth / 2,
        clientSignatureY + signatureHeight / 2,
        { align: "center", baseline: "middle" }
      );

      clientSignatureY += signatureHeight + 8;
    } else {
      // Display all signatures in a grid layout on the right side
      const signaturesPerRow = 2; // Number of signatures per row
      let signatureX = margin + usableWidth / 2;

      for (let i = 0; i < sortedSignatures.length; i++) {
        // Check if we need to start a new row
        if (i > 0 && i % signaturesPerRow === 0) {
          signatureX = margin + usableWidth / 2;
          clientSignatureY += signatureHeight + 10;

          // Check if we need a new page
          if (clientSignatureY + signatureHeight + 10 > pageHeight - 20) {
            addFooter(pageNumber);
            doc.addPage();
            pageNumber++;
            clientSignatureY = addHeader();
          }
        }

        const sig = sortedSignatures[i];

        // Add signature box
        doc.roundedRect(
          signatureX,
          clientSignatureY,
          signatureWidth,
          signatureHeight,
          borderRadius,
          borderRadius
        );

        // Add signature image
        doc.addImage(
          sig.data,
          "PNG",
          signatureX + (signatureWidth - 35) / 2,
          clientSignatureY + (signatureHeight - 15) / 2,
          35, // Signature image width
          15 // Signature image height
        );

        // Add signature date
        const signedDate = sig.date;

        doc.setFontSize(8);
        doc.setFont("Poppins", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(
          formatDate(signedDate),
          signatureX + signatureWidth / 2,
          clientSignatureY + signatureHeight + 5,
          { align: "center" }
        );

        // Move to next position horizontally
        signatureX += signatureWidth + 10;
      }

      // Update final Y position
      clientSignatureY += signatureHeight + 10;
    }

    // Set the final Y position
    currentY = Math.max(currentY + signatureHeight + 12, clientSignatureY);

    return currentY;
  };

  if (RentalListingData?.Bwd_Esign?.sections) {
    RentalListingData.Bwd_Esign.sections.forEach((section) => {
      currentY = addSectionHeader(section.sectionNumber, section.sectionTitle);
      if (section.content && section.content.table) {
        currentY = addTable(section.content.table);
      }
      if (section.content && section.content.paragraph) {
        currentY = addParagraph(section.content.paragraph);
      }
    });
  }

  const processQuoteItems = async () => {
    if (RentalListingData?.Bwd_Esign?.Quote_items) {
      for (const [
        itemIndex,
        quoteItem,
      ] of RentalListingData.Bwd_Esign.Quote_items.entries()) {
        // Add page if necessary
        if (itemIndex > 0 || currentY > pageHeight - 60) {
          addFooter(pageNumber);
          doc.addPage();
          pageNumber++;
          currentY = addHeader();
        }

        currentY += SECTION_TOP_MARGIN;
        currentY = checkPageBreak(15);
        doc.setFontSize(14);
        doc.setFont("Poppins", "bold");
        doc.setTextColor(60, 66, 129);
        doc.text(`Quote Item ${itemIndex + 1}`, pageWidth / 2, currentY, {
          align: "center",
        });
        currentY += HEADING_BOTTOM_MARGIN + 5;

        for (const section of quoteItem.item.sections) {
          currentY = addSectionHeader(
            section.sectionNumber,
            section.sectionTitle
          );

          if (section.content?.description) {
            currentY = addParagraph(section.content.description);
          }

          if (section.content?.table) {
            currentY = addTable(section.content.table);
          }

          if (section.content?.paragraph) {
            currentY = addHtmlContent(section.content.paragraph);
          }

          if (section.content?.subsections) {
            section.content.subsections.forEach((subsection) => {
              currentY = addSubsection(subsection);
            });
          }

          // Process service diagrams when needed
          if (
            section.sectionNumber === 7 &&
            Array.isArray(section.content.content)
          ) {
            currentY = await addServiceDiagrams(section.content.content);
          }
        }
      }
    }

    // Add signatures and footer
    await addSignatures();
    addFooter(pageNumber);
  };
  await processQuoteItems();
  return doc;
};

const BwdEsign = ({
  Bwd_Data,
  id,
  rec_email,
  rec_mobile,
  cus_id,
  rec_name,
  signatureData,
  is_readable,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const [RentalListingData, setRentalListingData] = useState(Bwd_Data);
  console.log(RentalListingData);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const Tempname = sessionStorage.getItem("TempName");
  const [download, setDownload] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { uid } = useParams();
  const [signatures, setSignatures] = useState([]);
  const [signaturesData, setSignaturesData] = useState(signatureData);
  const [open, setOpen] = useState(false);
  const [pdfData, setPdfData] = useState(null);

  const validateSignatures = (signatures) => {
    return signatures.every((sig) => sig.data && sig.data.length > 3500);
  };

  const handleAddSignature = () => {
    if (!RentalListingData?.no_of_signs) {
      enqueueSnackbar("Missing signature limit configuration", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      return;
    }

    const existingSignatures = Array.isArray(signatureData)
      ? signatureData.length
      : 0;
    const totalAllowedSigns = Number(RentalListingData.no_of_signs);
    const remainingSlots = Math.max(0, totalAllowedSigns - existingSignatures);
    if (signatures.length >= remainingSlots) {
      enqueueSnackbar(`Maximum ${totalAllowedSigns} signature(s) allowed`, {
        variant: "warning",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
      });
      return;
    }

    // Add new signature if slots are available
    setSignatures((prevSignatures) => [
      ...prevSignatures,
      { id: Date.now(), data: null },
    ]);
  };

  const handleRemoveSignature = (id) => {
    setSignatures(signatures.filter((sig) => sig.id !== id));
  };

  const updateSignatures = async (dataURL, id) => {
    const currentDate = new Date().toISOString();
    const updatedSignatures = signatures.map((sig) =>
      sig.id === id ? { ...sig, data: dataURL, date: currentDate } : sig
    );

    setSignatures(updatedSignatures);
    return updatedSignatures;
  };

  const handleSignature = async (dataURL, id) => {
    const updatedSignatures = await updateSignatures(dataURL, id);
    if (validateSignatures(updatedSignatures)) {
      setIsSubmitEnabled(true);
    } else {
      setIsSubmitEnabled(false);
      enqueueSnackbar(`Provide Proper Signature Data`, {
        variant: "info",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };
  const validationSchema = Yup.object().shape({});
  const formik = useFormik({
    initialValues: {},
    validationSchema,
    onSubmit: async (values) => {
      // setLoading(true);
      const validateSignatures = (signatures) => {
        if (signatures.length === 0) {
          return false;
        }
        return signatures.every((sig) => sig.data && sig.data.length > 3500);
      };
      if (validateSignatures(signatures)) {
        setIsSubmitEnabled(true);
      } else {
        setIsSubmitEnabled(false);
        enqueueSnackbar(`Provide Proper Signature Data`, {
          variant: "info",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        setLoading(false);
        return;
      }
      const doc = await generateServiceOrderPDF(
        RentalListingData,
        signatureData,
        signatures,
        cus_id,
        rec_name
      );
      const pdfBlob = doc.output("blob");
      setPdfData(pdfBlob);
      const now = new Date();
      const formattedDate = now
        .toLocaleDateString("en-GB")
        .split("/")
        .reverse()
        .join("-");
      const formattedTime = now.toLocaleTimeString("en-GB").replace(/:/g, "-");

      if (download) {
        const filename = `${rec_name}-Quote_Agreement_BWD-${formattedDate}_${formattedTime}.pdf`;
        setDownload(false);
        setLoading(false);
      } else {
        const filename = `${rec_name}-Quote_Agreement_BWD-${formattedDate}_${formattedTime}.pdf`;
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const msg_id = sessionStorage.getItem("uid");
        const payload = {
          file: pdfBase64,
          message_id: id,
          rec_email: rec_email,
          file_name: filename,
          file_mime_type: "pdf",
          type: "file",
          action: "Bwd_Esign",
          service: "Dropbox",
          stepper: "bwd_rental",
          msg_id: msg_id,
          pdf_name: "Quote_Agreement_BWD",
          signatures: signatures,
        };
        try {
          setLoading(true);
          const response = await axios.put(
            `${BASE_URL}/s3/files/${cus_id}`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          enqueueSnackbar("File uploaded successfully", {
            variant: "success",
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
          });
          setLoading(false);
          setOpen(true);
        } catch (error) {
          setLoading(false);
          const data = error.response.data.message;
          enqueueSnackbar(`${data}`, {
            variant: "error",
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
          });
        }
      }
    },
  });

  const handleDownload = () => {
    if (!pdfData) {
      enqueueSnackbar("No PDF to download", {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
      return;
    }
    const now = new Date();
    const formattedDate = now
      .toLocaleDateString("en-GB")
      .split("/")
      .reverse()
      .join("-");
    const formattedTime = now.toLocaleTimeString("en-GB").replace(/:/g, "-");
    const filename = `${rec_name}-Quote_Agreement_BWD-${formattedDate}_${formattedTime}.pdf`;
    const url = URL.createObjectURL(pdfData);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    navigate(`/result/success/${Tempname}Result`);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleDateString("en-GB");
    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${formattedDate}, ${formattedTime}`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/link_distributor`, {
        external_message_id: id,
        cus_id: cus_id,
        internal_message_id: uid,
      });
      if (response.status === 200) {
        setLoading(false);
        const data = response.data.message;
        enqueueSnackbar(`${data}`, {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
        window.close();
      }
    } catch (error) {
      setLoading(false);
      const data = error.response.data.error;
      enqueueSnackbar(`${data}`, {
        variant: "error",
        anchorOrigin: {
          vertical: "bottom",
          horizontal: "right",
        },
      });
    }
  };

  return (
    <Grid
      container
      sx={{ width: "100%", p: { xs: 2, sm: 3, md: 4 }, bgcolor: "#fafafa" }}
    >
      <form onSubmit={formik.handleSubmit} style={{ width: "100%" }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                mb: 2,
                borderRadius: theme.shape.borderRadius,
                background: "#3c4281",
                color: "white",
                textAlign: "center",
                py: 2,
                px: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{ width: isMobile ? "30%" : "8%", borderRadius: "50px" }}
              >
                <ImageDistributor
                  uid={cus_id}
                  logo={"Main_Logo"}
                  width="100%"
                  height={"auto"}
                  borderRadius={"20px"}
                />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "1.2rem", sm: "1.4rem", md: "1.6rem" },
                  }}
                >
                  {RentalListingData?.Bwd_Esign?.documentTitle}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    Service Order Number :
                  </span>
                  {RentalListingData?.Bwd_Esign?.service_order_number}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    Service Order Date :
                  </span>{" "}
                  {RentalListingData?.Bwd_Esign?.service_order_date}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    opacity: 0.9,
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    Internal Reference Number :
                  </span>
                  {RentalListingData?.Bwd_Esign?.service_order_reference_number}
                </Typography>
              </Box>
            </Card>
          </Grid>

          {/* Supplier Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, mb: 2, borderRadius: "12px" }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.3rem" },
                  fontWeight: 600,
                  pb: 1,
                  mb: 2,
                  borderBottom: "2px solid #2196f3",
                  color: "#333",
                }}
              >
                1. Supplier
              </Typography>
              <TableContainer sx={{ borderRadius: "8px", overflow: "hidden" }}>
                <Table>
                  <TableBody>
                    {RentalListingData?.Bwd_Esign?.sections
                      ?.filter((section) => section.sectionNumber === 1)[0]
                      ?.content?.table?.rows.map((row, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:nth-of-type(odd)": {
                              bgcolor: "rgba(0, 0, 0, 0.02)",
                            },
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              fontWeight: 500,
                              width: "35%",
                              borderBottom:
                                "1px solid rgba(224, 224, 224, 0.5)",
                            }}
                          >
                            {row.field}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              borderBottom:
                                "1px solid rgba(224, 224, 224, 0.5)",
                            }}
                          >
                            {row.value}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Customer Section */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, mb: 2, borderRadius: "12px" }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.3rem" },
                  fontWeight: 600,
                  pb: 1,
                  mb: 2,
                  borderBottom: "2px solid #2196f3",
                  color: "#333",
                }}
              >
                2. Customer
              </Typography>
              <TableContainer sx={{ borderRadius: "8px", overflow: "hidden" }}>
                <Table>
                  <TableBody>
                    {RentalListingData?.Bwd_Esign?.sections
                      ?.filter((section) => section.sectionNumber === 2)[0]
                      ?.content?.table?.rows.map((row, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            "&:nth-of-type(odd)": {
                              bgcolor: "rgba(0, 0, 0, 0.02)",
                            },
                          }}
                        >
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              fontWeight: 500,
                              width: "35%",
                              borderBottom:
                                "1px solid rgba(224, 224, 224, 0.5)",
                            }}
                          >
                            {row.field}
                          </TableCell>
                          <TableCell
                            sx={{
                              p: { xs: 1.5, sm: 2 },
                              fontSize: { xs: "0.875rem", sm: "1rem" },
                              borderBottom:
                                "1px solid rgba(224, 224, 224, 0.5)",
                            }}
                          >
                            {row.value}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Quote Items - Sections 3-7 */}
          {RentalListingData?.Bwd_Esign?.Quote_items?.map(
            (quoteItem, itemIndex) => (
              <Grid item xs={12} key={`quote-item-${itemIndex}`}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: "12px",
                    border: "1px solid rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                      fontWeight: 600,
                      mb: 2,
                      pb: 1,
                      borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
                      color: "#555",
                    }}
                  >
                    Quote Item {itemIndex + 1}
                  </Typography>

                  {/* Service Details */}
                  {quoteItem.item.sections.map((section, sectionIndex) => (
                    <Box
                      key={`section-${section.sectionNumber}-${itemIndex}`}
                      sx={{ mb: 4 }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" },
                          fontWeight: 600,
                          pb: 1,
                          mb: 2,
                          borderBottom: "2px solid #2196f3",
                          color: "#333",
                        }}
                      >
                        {section.sectionNumber}. {section.sectionTitle}
                      </Typography>

                      {section.content.description && (
                        <Typography
                          sx={{
                            mb: 3,
                            color: "#555",
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          {section.content.description}
                        </Typography>
                      )}

                      {section.content.table && (
                        <TableContainer
                          component={Paper}
                          elevation={1}
                          sx={{
                            borderRadius: "8px",
                            overflow: "hidden",
                            mb: 3,
                          }}
                        >
                          <Table>
                            <TableBody>
                              {section.content.table.rows?.map(
                                (row, rowIndex) => (
                                  <TableRow
                                    key={`row-${rowIndex}-${section.sectionNumber}-${itemIndex}`}
                                    sx={{
                                      "&:nth-of-type(odd)": {
                                        bgcolor: "rgba(0, 0, 0, 0.02)",
                                      },
                                    }}
                                  >
                                    <TableCell
                                      component="th"
                                      scope="row"
                                      sx={{
                                        p: { xs: 1.5, sm: 2 },
                                        fontSize: {
                                          xs: "0.875rem",
                                          sm: "1rem",
                                        },
                                        fontWeight: 500,
                                        width: "35%",
                                        borderBottom:
                                          "1px solid rgba(224, 224, 224, 0.5)",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        {row.id && (
                                          <Typography
                                            component="span"
                                            sx={{
                                              bgcolor: "#2196f3",
                                              color: "white",
                                              width: "22px",
                                              height: "22px",
                                              borderRadius: "50%",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "0.75rem",
                                              mr: 1,
                                              flexShrink: 0,
                                            }}
                                          >
                                            {row.id}
                                          </Typography>
                                        )}
                                        {row.field}
                                      </Box>
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        p: { xs: 1.5, sm: 2 },
                                        fontSize: {
                                          xs: "0.875rem",
                                          sm: "1rem",
                                        },
                                        borderBottom:
                                          "1px solid rgba(224, 224, 224, 0.5)",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        {row.value}
                                        {row.comment && (
                                          <Tooltip
                                            title={row.comment.text}
                                            arrow
                                            placement="top"
                                          >
                                            <Box
                                              component="span"
                                              sx={{
                                                ml: 1,
                                                bgcolor: "#f5f5f5",
                                                color: "#666",
                                                borderRadius: "50%",
                                                width: "18px",
                                                height: "18px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.75rem",
                                                cursor: "help",
                                                boxShadow:
                                                  "0 1px 3px rgba(0,0,0,0.1)",
                                              }}
                                            >
                                              ?
                                            </Box>
                                          </Tooltip>
                                        )}
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}

                      {/* Render text content, subsections, paragraphs, etc */}
                   {section.content.paragraph && (
  <Typography
    sx={{
      fontSize: { xs: "0.875rem", sm: "1rem" },
      mb: 2,
      color: "#555",
      lineHeight: 1.6,
      overflowWrap: "break-word", // Ensures text breaks to prevent overflow
      wordWrap: "break-word",     // Additional support for older browsers
      maxWidth: "100%",           // Constrains width to parent container
      boxSizing: "border-box",    // Includes padding in width calculation
      padding: "0",               // Reset padding to ensure content fits
    }}
    component="div" // ensures block rendering for HTML
    dangerouslySetInnerHTML={{
      __html: section.content.paragraph,
    }}
  />
)}

                      {section.content.subsections?.map(
                        (subsection, subIndex) => (
                          <Box
                            key={`subsection-${subIndex}`}
                            sx={{
                              mt: 2,
                              p: 2,
                              borderLeft: "3px solid #e0e0e0",
                              bgcolor: "rgba(0,0,0,0.01)",
                              borderRadius: "0 8px 8px 0",
                            }}
                          >
                            {subsection.title && (
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 600,
                                  mb: 1.5,
                                  color: "#333",
                                  fontSize: { xs: "0.9rem", sm: "1rem" },
                                }}
                              >
                                {subsection.title}
                              </Typography>
                            )}

                            {subsection.text && (
                              <Typography
                                sx={{
                                  fontSize: { xs: "0.875rem", sm: "1rem" },
                                  mb: 1.5,
                                  color: "#555",
                                  lineHeight: 1.6,
                                }}
                                paragraph
                              >
                                {subsection.id && (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontWeight: 600,
                                      color: "#333",
                                      mr: 0.5,
                                    }}
                                  >
                                    {subsection.id}
                                  </Box>
                                )}
                                {subsection.text}
                              </Typography>
                            )}

                            {subsection.additionalText && (
                              <Typography
                                sx={{
                                  fontSize: { xs: "0.875rem", sm: "1rem" },
                                  mb: 1.5,
                                  color: "#555",
                                  lineHeight: 1.6,
                                  fontStyle: "italic",
                                }}
                                paragraph
                              >
                                {subsection.additionalText}
                              </Typography>
                            )}

                            {subsection.paragraphs?.map((para, paraIndex) => {
                              // Handle simple string paragraphs
                              if (typeof para === "string") {
                                return (
                                  <Typography
                                    key={`para-${paraIndex}`}
                                    sx={{
                                      fontSize: { xs: "0.875rem", sm: "1rem" },
                                      mb: 1.5,
                                      color: "#555",
                                      lineHeight: 1.6,
                                    }}
                                    paragraph
                                  >
                                    {para}
                                  </Typography>
                                );
                              }

                              // Skip complex objects (lists, definitions) - will be handled separately
                              if (para.list || para.definitions) {
                                return null;
                              }

                              // Handle any other simple objects
                              return (
                                <Typography
                                  key={`para-${paraIndex}`}
                                  sx={{
                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                    mb: 1.5,
                                    color: "#555",
                                    lineHeight: 1.6,
                                  }}
                                  paragraph
                                >
                                  {String(para)}
                                </Typography>
                              );
                            })}

                            {/* Handle paragraphs with lists separately */}
                            {subsection.paragraphs?.map((para, paraIndex) =>
                              para && para.list ? (
                                <Box
                                  key={`list-para-${paraIndex}`}
                                  sx={{ pl: 3, mt: 1, mb: 2 }}
                                >
                                  {para.list.map((item, listIndex) => (
                                    <Box
                                      key={`list-item-${listIndex}`}
                                      sx={{
                                        display: "flex",
                                        mb: 1.5,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          mr: 1,
                                          fontWeight: 600,
                                          color: "#333",
                                          fontSize: {
                                            xs: "0.875rem",
                                            sm: "1rem",
                                          },
                                        }}
                                      >
                                        {item.id}
                                      </Box>
                                      <Typography
                                        sx={{
                                          fontSize: {
                                            xs: "0.875rem",
                                            sm: "1rem",
                                          },
                                          color: "#555",
                                          lineHeight: 1.6,
                                        }}
                                      >
                                        {item.text}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              ) : null
                            )}

                            {/* Handle paragraphs with definitions separately */}
                            {subsection.paragraphs?.map((para, paraIndex) =>
                              para && para.definitions ? (
                                <Box
                                  key={`def-para-${paraIndex}`}
                                  sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: "rgba(33, 150, 243, 0.05)",
                                    borderRadius: "8px",
                                  }}
                                >
                                  {para.definitions.map((def, defIndex) => (
                                    <Box
                                      key={`def-${defIndex}`}
                                      sx={{
                                        mb: 1.5,
                                        "&:last-child": { mb: 0 },
                                      }}
                                    >
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontWeight: 600,
                                          color: "#333",
                                          fontSize: {
                                            xs: "0.875rem",
                                            sm: "1rem",
                                          },
                                          display: "inline-block",
                                          mr: 0.5,
                                        }}
                                      >
                                        {def.term}:
                                      </Typography>
                                      <Typography
                                        component="span"
                                        sx={{
                                          fontSize: {
                                            xs: "0.875rem",
                                            sm: "1rem",
                                          },
                                          color: "#555",
                                        }}
                                      >
                                        {def.definition}
                                      </Typography>
                                    </Box>
                                  ))}
                                </Box>
                              ) : null
                            )}

                            {subsection.list && (
                              <Box sx={{ pl: 3, mt: 1 }}>
                                {subsection.list.map((item, listIndex) => (
                                  <Box
                                    key={`list-item-${listIndex}`}
                                    sx={{
                                      display: "flex",
                                      mb: 1.5,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        mr: 1,
                                        fontWeight: 600,
                                        color: "#333",
                                        fontSize: {
                                          xs: "0.875rem",
                                          sm: "1rem",
                                        },
                                      }}
                                    >
                                      {item.id})
                                    </Box>
                                    <Typography
                                      sx={{
                                        fontSize: {
                                          xs: "0.875rem",
                                          sm: "1rem",
                                        },
                                        color: "#555",
                                        lineHeight: 1.6,
                                      }}
                                    >
                                      {item.text}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}

                            {subsection.definitions && (
                              <Box
                                sx={{
                                  mt: 2,
                                  p: 2,
                                  bgcolor: "rgba(33, 150, 243, 0.05)",
                                  borderRadius: "8px",
                                }}
                              >
                                {subsection.definitions.map((def, defIndex) => (
                                  <Box
                                    key={`def-${defIndex}`}
                                    sx={{ mb: 1.5, "&:last-child": { mb: 0 } }}
                                  >
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontWeight: 600,
                                        color: "#333",
                                        fontSize: {
                                          xs: "0.875rem",
                                          sm: "1rem",
                                        },
                                        display: "inline-block",
                                        mr: 0.5,
                                      }}
                                    >
                                      {def.term}:
                                    </Typography>
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontSize: {
                                          xs: "0.875rem",
                                          sm: "1rem",
                                        },
                                        color: "#555",
                                      }}
                                    >
                                      {def.definition}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        )
                      )}
                      {/* Service Diagram section - Improved layout */}
                      {section.sectionNumber === 7 &&
                        Array.isArray(section.content.content) && (
                          <Box
                            sx={{
                              mt: 3,
                              width: "100%",
                            }}
                          >
                            <Grid container spacing={3}>
                              {section.content.content.map(
                                (diagram, diagramIndex) => (
                                  <Grid
                                    item
                                    xs={12}
                                    md={6}
                                    key={`diagram-${diagramIndex}`}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        height: "100%",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: "100%",
                                          mb: 2,
                                          display: "flex",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <img
                                          src={diagram.url}
                                          alt={`Service Diagram ${
                                            diagramIndex + 1
                                          }`}
                                          style={{
                                            width: "100%",
                                            maxWidth: "450px",
                                            height: "auto",
                                            borderRadius: "8px",
                                            boxShadow:
                                              "0 4px 8px rgba(0,0,0,0.1)",
                                          }}
                                        />
                                      </Box>
                                      <Typography
                                        sx={{
                                          fontSize: {
                                            xs: "0.9rem",
                                            sm: "1rem",
                                          },
                                          color: "#555",
                                          fontWeight: 500,
                                          textAlign: "center",
                                        }}
                                      >
                                        {diagram.name}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )
                              )}
                            </Grid>
                          </Box>
                        )}
                    </Box>
                  ))}
                </Paper>
              </Grid>
            )
          )}

          {/* Signature Section */}
          {/* Signature Section */}
          {is_readable ? null : (
            <>
              <Grid item xs={12}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: "12px",
                    mt: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.3rem" },
                      fontWeight: 600,
                      pb: 1,
                      mb: 3,
                      borderBottom: "2px solid #2196f3",
                      color: "#333",
                    }}
                  >
                    Signatures
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Purchaser Signature */}
                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.9rem", sm: "1rem" },
                            mb: 1,
                            color: "#333",
                          }}
                        >
                          Company Signature
                        </Typography>
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box
                            sx={{
                              width: "180px",
                              height: "90px",
                              border: "2px solid #e0e0e0",
                              borderRadius: "8px",
                              p: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mb: 1,
                              background: "#fff",
                            }}
                          >
                            <img
                              src={logo}
                              alt="Manager Sign"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#666",
                              mt: 1,
                              fontSize: "0.75rem",
                            }}
                          >
                           {formatDate(new Date())}

                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Vendor Signatures */}
                    <Grid item xs={12} sm={12} md={8}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.9rem", sm: "1rem" },
                            mb: 1,
                            color: "#333",
                          }}
                        >
                          Signatures
                        </Typography>

                        {/* Existing Signatures */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          {signaturesData &&
                            Array.isArray(signaturesData) &&
                            signaturesData.length > 0 &&
                            signaturesData
                              .slice()
                              .sort(
                                (a, b) => new Date(b.date) - new Date(a.date)
                              )
                              .map((signature, index) => (
                                <Grid
                                  item
                                  xs={12}
                                  sm={6}
                                  md={4}
                                  key={signature.id}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: "180px",
                                        height: "90px",
                                        border: "2px solid #e0e0e0",
                                        borderRadius: "8px",
                                        p: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mb: 1,
                                        background: "#fff",
                                      }}
                                    >
                                      <img
                                        src={signature.data}
                                        alt={`Signature ${index + 1}`}
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "100%",
                                          objectFit: "contain",
                                        }}
                                      />
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "#666",
                                        mt: 1,
                                        fontSize: "0.75rem",
                                        textAlign: "center",
                                      }}
                                    >
                                      {formatDate(signature.date)}
                                    </Typography>
                                  </Box>
                                </Grid>
                              ))}

                          {/* Add Signature Button (hidden when readonly) */}
                          {!is_readable &&
                            !signatures.some((sig) => sig.isActive) && (
                              <Grid item xs={12} sm={6} md={4}>
                                <Box
                                  sx={{
                                    width: "180px",
                                    height: "90px",
                                    border: "2px dashed #2196f3",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                      backgroundColor:
                                        "rgba(33, 150, 243, 0.05)",
                                    },
                                  }}
                                  onClick={handleAddSignature}
                                >
                                  <AddIcon
                                    sx={{
                                      fontSize: "2rem",
                                      color: "#2196f3",
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#666",
                                    mt: 1,
                                    fontSize: "0.75rem",
                                    textAlign: "center",
                                    display: "block",
                                  }}
                                >
                                  Add Signature
                                </Typography>
                              </Grid>
                            )}
                          {signatures.map((signature) => (
                            <Grid item xs={12} key={signature.id}>
                              <Paper
                                elevation={2}
                                sx={{
                                  my: 2,
                                  p: 2,
                                  borderRadius: "8px",
                                  border: "1px solid rgba(0, 0, 0, 0.05)",
                                }}
                              >
                                <Grid container alignItems="center" spacing={2}>
                                  <Grid item xs={1}>
                                    <IconButton
                                      onClick={() =>
                                        handleRemoveSignature(signature.id)
                                      }
                                      sx={{ color: "#f44336" }}
                                    >
                                      <RemoveCircleIcon />
                                    </IconButton>
                                  </Grid>
                                  <Grid item xs={11}>
                                    <SignaturePad
                                      onSignature={(dataURL) =>
                                        handleSignature(dataURL, signature.id)
                                      }
                                      email={rec_email}
                                      mobile={rec_mobile}
                                      sf_id={id}
                                    />
                                  </Grid>
                                </Grid>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Submit Button */}
              {!is_readable && (
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 4,
                  }}
                >
                  <Button
                    variant="contained"
                    type="submit"
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: 500,
                      background:
                        "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
                      boxShadow: "0 3px 5px rgba(33, 150, 243, 0.3)",
                    }}
                  >
                    Submit
                  </Button>
                </Grid>
              )}

              {/* Action Buttons */}
              {is_readable ? (
                <Grid
                  item
                  xs={12}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 4,
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: 500,
                      boxShadow: "0 3px 5px rgba(33, 150, 243, 0.3)",
                    }}
                  >
                    Send To Recipient
                  </Button>
                </Grid>
              ) : null}
            </>
          )}
        </Grid>
      </form>

      {/* Modal for download confirmation */}
      <Modal
        open={open}
        onClose={() => {}}
        aria-labelledby="download-modal-title"
        disableEscapeKeyDown
        BackdropProps={{
          onClick: (e) => e.stopPropagation(),
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: "400px" },
            bgcolor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            p: 4,
            outline: "none",
          }}
        >
          <Typography
            id="download-modal-title"
            variant="h6"
            sx={{
              textAlign: "center",
              fontWeight: 600,
              color: "#333",
              mb: 2,
            }}
          >
            Download PDF
          </Typography>
          <Typography
            sx={{
              mt: 2,
              textAlign: "center",
              color: "#555",
              fontSize: "1rem",
            }}
          >
            Your file was uploaded successfully. Would you like to download the
            PDF?
          </Typography>
          <Box
            sx={{
              textAlign: "center",
              mt: 4,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              onClick={handleDownload}
              sx={{
                px: 3,
                py: 1,
                borderRadius: "8px",
                fontWeight: 500,
                background: "linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)",
                boxShadow: "0 3px 5px rgba(33, 150, 243, 0.3)",
              }}
            >
              Download PDF
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 9999,
            background: "rgba(255, 255, 255, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(3px)",
          }}
        >
          <RotateSpinner size={60} color="#2196f3" loading={loading} />
        </Box>
      )}
    </Grid>
  );
};

export default BwdEsign;
