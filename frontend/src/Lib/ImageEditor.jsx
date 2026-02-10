import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';

const ImageEditor = ({ image, onSave, onCancel }) => {
  const [imageToEdit, setImageToEdit] = useState(null);
  const [imageLines, setImageLines] = useState(image.lines || []);
  const [drawColor, setDrawColor] = useState('#FF0000');
  const [eraserSize, setEraserSize] = useState(10);
  const stageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = image.src;
    img.onload = () => setImageToEdit(img);
  }, [image]);

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    if (drawColor === '#FFFFFF') {
      handleEraseLine(pos.x, pos.y); // Eraser logic
    } else {
      const updatedLines = [...imageLines, { points: [pos.x, pos.y], color: drawColor, strokeWidth: 5 }];
      setImageLines(updatedLines);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || drawColor === '#FFFFFF') return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = imageLines[imageLines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    const updatedLines = [...imageLines.slice(0, -1), lastLine];
    setImageLines(updatedLines);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleEraseLine = (x, y) => {
    const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    const newLines = imageLines.filter(line =>
      !line.points.some((point, idx) => idx % 2 === 0 && distance(point, line.points[idx + 1], x, y) < eraserSize)
    );
    setImageLines(newLines);
  };

  const handleColorChange = (color) => {
    setDrawColor(color);
  };

  const handleSaveConfirmation = () => {
    setConfirmationOpen(true);
  };

  const handleConfirmSave = () => {
    const stage = stageRef.current;
    const dataURL = stage.toDataURL();
    onSave({ ...image, src: dataURL, lines: imageLines });
    setConfirmationOpen(false);
  };

  return (
    <>
      <Modal
        open={true}
        onClose={onCancel}
      >
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '90%', maxWidth: 800, bgcolor: 'background.paper', boxShadow: 24, p: 4,
        }}>
          <IconButton aria-label="close" onClick={onCancel}>
            <CloseIcon />
          </IconButton>
          <Typography variant="h6">Edit Image</Typography>
          <Stage
            width={700}
            height={400}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              {imageToEdit && (
                <KonvaImage
                  image={imageToEdit}
                  x={0}
                  y={0}
                  width={700}
                  height={400}
                />
              )}
              {imageLines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth || 5}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
            </Layer>
          </Stage>
          <Box sx={{ mt: 2 }}>
            {['#FF0000', '#00FF00', '#FFFFFF'].map(color => (
              <Button key={color} onClick={() => handleColorChange(color)} style={{ backgroundColor: color, margin: '5px' }}>
                {color === '#FFFFFF' ? 'Eraser' : ''}
              </Button>
            ))}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleSaveConfirmation}>Save Changes</Button>
            <Button onClick={onCancel} sx={{ ml: 2 }}>Discard Changes</Button>
          </Box>
        </Box>
      </Modal>

      <Modal
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
      >
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 300, bgcolor: 'background.paper', boxShadow: 24, p: 4,
        }}>
          <Typography variant="h6" gutterBottom>
            Are you sure you want to save the changes? Changes cannot be undone.
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleConfirmSave} variant="contained">Yes</Button>
            <Button onClick={() => setConfirmationOpen(false)} sx={{ ml: 2 }}>Cancel</Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ImageEditor;
