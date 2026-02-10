import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import { ChromePicker } from "react-color";
import { useSnackbar } from "notistack";

import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";

const BrandColorTable = ({ uid }) => {
  const [editedData, setEditedData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [demoTextColor, setDemoTextColor] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await Controller.ApiController(
          "",
          apiEndPoint.USER_BRANDING_DATA + uid,
          "GET"
        );
        if (result.success === true) {
          setEditedData(result.data.branding.branding_color);
        } else {
          enqueueSnackbar(`${result.data}`, {
            variant: "error",
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "right",
            },
          });
        }
      } catch (error) {
        console.log("Color Branding", error);
      }
    };

    fetchData();
  }, []);

  const handleColorChange = (color) => {
    const updatedData = editedData.map((brand) => {
      if (brand.page_name === selectedPage) {
        return {
          ...brand,
          styles: {
            ...brand.styles,
            [selectedStyle]: {
              ...brand.styles[selectedStyle],
              color: color.hex,
            },
          },
        };
      }
      return brand;
    });
    setEditedData(updatedData);
    setDemoTextColor(color.hex);
  };

  const handleUpdate = async (pageName) => {
    try {
      const dataToSubmit = {
        objectName: "branding_color",
        updatedData: editedData.find((brand) => brand.page_name === pageName),
      };
      const result = await Controller.ApiController(
        dataToSubmit,
        apiEndPoint.USER_BRANDING_DATA + uid,
        "PUT"
      );

      if (result.success === true) {
        enqueueSnackbar(`${result.data.message}`, {
          variant: "success",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      } else {
        enqueueSnackbar(`${result.data}`, {
          variant: "error",
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right",
          },
        });
      }
    } catch (error) {
      console.log("Color Branding", error);
    }
  };

  const handleClick = (pageName, styleKey) => (event) => {
    setSelectedPage(pageName);
    setSelectedStyle(styleKey);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePopoverClose = (event) => {
    event.stopPropagation();
  };

  const open = Boolean(anchorEl);
  const id = open ? "color-picker-popover" : undefined;

  return (
    <Grid container spacing={3}>
      {editedData.map((brand) => (
        <Grid item xs={12} key={brand.page_name}>
          <Paper style={{ padding: "20px" }}>
            <h3>{brand.page_name}</h3>
            <Grid container spacing={2} style={{ marginTop: "5px" }}>
              {Object.keys(brand.styles).map((styleKey) => (
                <Grid item xs={12} md={4} lg={3} key={styleKey}>
                  <TextField
                    label={`${styleKey} Color`}
                    value={brand.styles[styleKey].color}
                    onClick={handleClick(brand.page_name, styleKey)}
                    size="small"
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <div
                          style={{
                            marginLeft: "10px",
                            color: brand.styles[styleKey].color,
                            width: "80%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            fontWeight: "bold",
                          }}
                        >
                          Demo Text
                        </div>
                      ),
                    }}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button onClick={() => handleUpdate(brand.page_name)}>
                  Update
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClick={handlePopoverClose}
      >
        <ChromePicker
          color={
            editedData.find((brand) => brand.page_name === selectedPage)
              ?.styles[selectedStyle].color
          }
          onChange={handleColorChange}
        />
      </Popover>
    </Grid>
  );
};

export default BrandColorTable;
