import React, { useState } from "react";
import { Dashboard as DashboardIcon } from "@mui/icons-material";
import CustomerIcon from "@mui/icons-material/Person";
import "./admin.css";
import {
  Tooltip,
  Container,
  Grid,
  Typography,
  Modal,
  Paper,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material";
import logo from "../../Assets/Images/Securegateway-Gradient.png";
import AdminDashBoard from "./AdminDashBoard";
import AdminConfig from "./AdminConfig";
import AdminBranding from "./AdminBranding";
import SuperAdminUser from "./SuperAdminUser";
import SuperAdminDashboard from "./SuperAdminDashboard";
import SuperAdminCustomers from "./SuperAdminCustomers";
import SuperAdminBranding from "./SuperAdminBranding";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../config";
import UserForm from "./UserUpdation";

const Admin = ({ role }) => {
  const DashboardComponent =
    role === "admin" ? AdminDashBoard : SuperAdminDashboard;

  const [closeMenu, setCloseMenu] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState(
    <DashboardComponent />
  );

  const username = sessionStorage.getItem("UserName");
  const email_id = sessionStorage.getItem("email_id");
  const token = sessionStorage.getItem("token");
  const email = sessionStorage.getItem("email_id");
  const navigate = useNavigate();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleCloseMenu = () => {
    setCloseMenu(!closeMenu);
  };

  const handleIconClick = (component) => {
    setSelectedComponent(component);
  };

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const handleLogout = async () => {
    setIsConfirmationOpen(true);
  };

  const handleLogoutConfirmed = async () => {
    setIsConfirmationOpen(false);
    try {
      const response = await axios.post(`${BASE_URL}/logout/${email_id}`, {
        headers: {
          Token: `${token}`,
          email_id: email,
        },
      });
      if (response.data.message === "Logged Out Successfully") {
        navigate("/");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleCancelLogout = () => {
    setIsConfirmationOpen(false);
  };

  const navigationItems = {
    admin: [
      {
        icon: <DashboardIcon />,
        label: "Dashboard",
        component: <AdminDashBoard />,
      },
      {
        icon: <SettingsIcon />,
        label: "Configuration",
        component: <AdminConfig />,
      },
      {
        icon: <ColorLensIcon />,
        label: "Branding Configuration",
        component: <AdminBranding />,
      },
      {
        icon: <ExitToAppIcon onClick={handleLogout} />,
        label: "Logout",
      },
    ],
    superadmin: [
      {
        icon: <DashboardIcon />,
        label: "Dashboard",
        component: <SuperAdminDashboard />,
      },
      {
        icon: <CustomerIcon />,
        label: "User Management",
        component: <SuperAdminUser />,
      },
      {
        icon: <GroupIcon />,
        label: "Customer Configuration Management",
        component: <SuperAdminCustomers />,
      },
      {
        icon: <ColorLensIcon />,
        label: "Customer Branding Management",
        component: <SuperAdminBranding />,
      },
      {
        icon: <ExitToAppIcon onClick={handleLogout} />,
        label: "Logout",
      },
    ],
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Grid id="admin">
        {closeMenu && (
          <Grid className="topNavbar">
            <Grid
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "20px",
              }}
            >
              <Grid>
                <Typography
                  className="welcomeMessage"
                  style={{ marginLeft: "40px" }}
                >
                  Welcome, {username}!👋
                </Typography>
              </Grid>
              <Grid>
                <img
                  src={logo}
                  alt="icon"
                  className="profile"
                  style={{ height: "40px" }}
                  onClick={handleOpenModal}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        <Grid className={closeMenu === false ? "sidebar" : "sidebar active"}>
          {closeMenu === false && (
            <img
              src={logo}
              alt="icon"
              className="logo"
              style={{ height: "50px" }}
            />
          )}

          <Grid
            className={
              closeMenu === false ? "burgerContainer" : "burgerContainer_active"
            }
          >
            <Grid
              className="burgerTrigger"
              onClick={() => {
                handleCloseMenu();
              }}
            ></Grid>
            <Grid className="burgerMenu"></Grid>
          </Grid>
          <Grid
            className={
              closeMenu === false
                ? "profileContainer"
                : "profileContainer_active"
            }
          >
            {/* <img src={tplLogo} alt="icon" className="profile" /> */}
            <Grid
              className={
                closeMenu === false
                  ? "profileContents"
                  : "profileContents_active"
              }
            >
              <p className="name">Hello, {username}👋</p>
              <p>{email_id}</p>
            </Grid>
          </Grid>
          <Grid
            className={
              closeMenu === false
                ? "contentsContainer"
                : "contentsContainer_active"
            }
          >
            <ul>
              {navigationItems[role].map((item, index) => (
                <li key={index} onClick={() => handleIconClick(item.component)}>
                  <Tooltip title={item.label} placement="right">
                    {item.icon}
                  </Tooltip>
                  <p>{item.label}</p>
                </li>
              ))}
            </ul>
          </Grid>
        </Grid>
      </Grid>
      <Container
        maxWidth="lg"
        className={closeMenu ? "containerOpen" : "containerClosed"}
      >
        <Grid>{selectedComponent}</Grid>
      </Container>

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: 20,
            width: isSmallScreen ? "80%" : "40%",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <UserForm onClose={handleCloseModal} />
        </Paper>
      </Modal>

      <Modal
        open={isConfirmationOpen}
        onClose={handleCancelLogout}
        aria-labelledby="logout-confirmation-dialog-title"
        aria-describedby="logout-confirmation-dialog-description"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: 20,
            width: isSmallScreen ? "80%" : "auto",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <Typography variant="h6" id="logout-confirmation-dialog-title">
            Are you sure you want to logout?
          </Typography>
          <Grid
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            <Grid>
              <Button onClick={handleCancelLogout}>Cancel</Button>
            </Grid>
            <Grid>
              <Button onClick={handleLogoutConfirmed}>Logout</Button>
            </Grid>
          </Grid>
        </Paper>
      </Modal>
    </>
  );
};

export default Admin;
