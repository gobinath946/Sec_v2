import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Grid,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useSnackbar } from "notistack";

import { apiEndPoint } from "../../Service/ApiConstant";
import Controller from "../../Service/ApiController";

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email_id: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false); 
  const { enqueueSnackbar } = useSnackbar();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await Controller.ApiController(
        formData,
        apiEndPoint.ADMIN_LOGIN,
        "POST"
      );
      if (result.success === true) {
        const { token, companyPermissions, email_id, userName, user_uid } =
          result.data;
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("email_id", email_id);
        sessionStorage.setItem("UserName", userName);
        sessionStorage.setItem("userUid", user_uid);
        navigate(`master/${companyPermissions}/settings`);
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
      console.log("Login.js", error);
    }
  };

  return (
    <Container maxWidth="xs">
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ minHeight: "100vh" }}
      >
        <Grid item xs={12}>
          <Paper elevation={3} style={{ padding: 20 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Secure Gateway Login
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2} mt={2}>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    label="Email"
                    name="email_id"
                    value={formData.email_id}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                  >
                    Login
                  </Button>
                </Grid>

                <Grid item xs={12}>
                  <Link to="/resetpassword" style={{ textDecoration: "none" }}>
                    <Typography textAlign="center" color="primary">
                      Forget Password ?
                    </Typography>
                  </Link>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LoginForm;
