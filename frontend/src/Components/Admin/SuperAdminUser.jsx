import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Grid,
  Button,
  Modal,
  TextField,
  MenuItem,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { useSnackbar } from "notistack";
import { apiEndPoint } from "../../Service/ApiConstant";
import Controller from "../../Service/ApiController";

const SuperAdminUser = () => {
  const [users, setusers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] =
    useState(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [err, setErrors] = useState({});
  const [editedUserData, setEditedUserData] = useState({
    email_id: "",
    user_name: "",
    mobile_number: "",
    company_name: "",
    company_level_permissions: [],
    password: "",
  });

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));


  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const fetchData = async (page) => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.GET_ALL_USERS + page,
        "GET"
      );
      if (result.success === true) {
        setusers(result.data.users);
        setTotalPages(result.data.totalPages);
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
      console.error("Super Admin User", error);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditedUserData({
      email_id: user.email_id,
      user_name: user.user_name,
      mobile_number: user.mobile_number,
      company_name: user.company_name,
      company_level_permissions: user.company_level_permissions,
      password: "",
    });
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCreateModalOpen = () => {
    setOpenCreateModal(true);
  };

  const handleCreateModalClose = () => {
    setOpenCreateModal(false);
  };

  const handleInputChange = (event, setErrorCallback) => {
    const { name, value } = event.target;
    setEditedUserData((prevUserData) => ({
      ...prevUserData,
      [name]: value,
    }));
    if (setErrorCallback && typeof setErrorCallback === "function") {
      setErrorCallback(name, validateField(name, value));
    }
  };

  const validateField = (fieldName, value) => {
    let error = "";
    switch (fieldName) {
      case "email_id":
        error = !value
          ? "Email ID is Required"
          : !/\S+@\S+\.\S+/.test(value)
          ? "Invalid email address"
          : "";
        break;
      case "user_name":
        error = !value ? "User Name is Required" : "";
        break;
      case "mobile_number":
        error = !value
          ? "Mobile Number is Required"
          : !/^\d{10}$/.test(value)
          ? "Invalid mobile number"
          : "";
        break;
      case "company_name":
        error = !value ? "Company Name is Required" : "";
        break;
      case "password":
        error =
          value &&
          !/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}/.test(value)
            ? "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
            : "";
        break;
      default:
        break;
    }
    return error;
  };

  const initialValues = {
    email_id: "",
    user_name: "",
    mobile_number: "",
    company_name: "",
    company_level_permissions: [],
    password: "",
  };

  const validationSchema = Yup.object().shape({
    email_id: Yup.string()
      .email("Invalid email")
      .required("Email ID is Required"),
    user_name: Yup.string().required("User Name is Required"),
    mobile_number: Yup.string().required("Number is Required"),
    company_name: Yup.string().required(" Company Name is Required"),
    company_level_permissions: Yup.array()
      .min(1, "At least one permission is required")
      .required("Company Level Permission is Required"),
    password: Yup.string()
      .matches(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/,
        "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one number, and one special character."
      )
      .required("password is Required"),
  });

  const handleSubmit = async (values) => {
    try {
      const result = await Controller.ApiController(
        values,
        apiEndPoint.USER_ROLE_FETCHER,
        "POST"
      );
      if (result.success === true) {
        fetchData(currentPage);
        setOpenCreateModal(false);

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
      console.error("Super Admin User", error);
    }
  };

  const setErrorCallback = (fieldName, error) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [fieldName]: error,
    }));
  };

  const editValidationSchema = Yup.object().shape({
    email_id: Yup.string()
      .email("Invalid email")
      .required("Email ID is Required"),
    user_name: Yup.string().required("User Name is Required"),
    mobile_number: Yup.string().required("Number is Required"),
    company_name: Yup.string().required(" Company Name is Required"),
    company_level_permissions: Yup.array()
      .min(1, "At least one permission is required")
      .required("Company Level Permission is Required"),
  });

  const companyLevelPermissions = ["admin"];

  const handleConfirmationModalOpen = () => {
    setOpenConfirmationModal(true);
  };

  const handleConfirmationModalClose = () => {
    setOpenConfirmationModal(false);
  };

  const handleSaveChanges = () => {
    const hasErrors = Object.values(err).some((error) => error !== "");
    if (hasErrors) {
      return;
    }
    handleConfirmationModalOpen();
  };

  const handleConfirmSaveChanges = async () => {
    try {
      const result = await Controller.ApiController(
        editedUserData,
        apiEndPoint.USER_ROLE_FETCHER + selectedUser.user_uid,
        "PUT"
      );
      if (result.success === true) {
        fetchData(currentPage);
        setOpenModal(false);
        handleConfirmationModalClose();
        enqueueSnackbar(`User Updated Successfully`, {
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
      console.error("Super Admin User", error);
    }
  };

  const handleDeleteConfirmationModalOpen = (user) => {
    setUserToDelete(user);
    setOpenDeleteConfirmationModal(true);
  };

  const handleDeleteConfirmationModalClose = () => {
    setOpenDeleteConfirmationModal(false);
  };

  const handleDelete = (user) => {
    handleDeleteConfirmationModalOpen(user);
  };

  const handleConfirmDelete = async () => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.USER_ROLE_FETCHER + userToDelete.user_uid,
        "DELETE"
      );
      if (result.success === true) {
        fetchData(currentPage);
        handleDeleteConfirmationModalClose();
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
      console.error("Super Admin User", error);
    }
  };

  const ClicksendTokenVisibility = () => {
    setShowToken((prevShowToken) => !prevShowToken);
  };

  return (
    <>
      <Grid style={{ textAlign: "center" }}>
        <h3>User Management</h3>
      </Grid>
      <Grid
        style={{
          display: "flex",
          alignItems: "left",
          justifyContent: "left",
        }}
      >
        <Button
          onClick={handleCreateModalOpen}
          variant="contained"
          color="primary"
          style={{ marginTop: "10px" }}
        >
          Create User
        </Button>
      </Grid>
      <Grid style={{ marginTop: "20px" }}>
        <Grid sx={{ marginTop: "20px" }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.no</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>User Name</TableCell>
                  <TableCell>Mobile Number</TableCell>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((customer, index) => (
                  <TableRow key={customer.user_uid}>
                    <TableCell>{(currentPage - 1) * 5 + index + 1}</TableCell>
                    <TableCell>{customer.email_id}</TableCell>
                    <TableCell>{customer.user_name}</TableCell>
                    <TableCell>{customer.mobile_number}</TableCell>
                    <TableCell>{customer.company_name}</TableCell>
                    <TableCell>
                      <Button onClick={() => handleEdit(customer)}>Edit</Button>
                      <Button onClick={() => handleDelete(customer)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <Grid>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              variant="outlined"
              shape="rounded"
            />
          </Grid>
        </Grid>
      </Grid>
      <Modal
        open={openModal}
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
            width: isSmallScreen ? "80%" : "auto",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <h2>Edit User Details</h2>
          <Formik
            initialValues={editedUserData}
            validationSchema={editValidationSchema}
            onSubmit={handleSaveChanges}
          >
            {({ setFieldValue }) => (
              <Form>
                <TextField
                  label="Email"
                  name="email_id"
                  value={editedUserData.email_id}
                  onChange={(e) => handleInputChange(e, setErrorCallback)}
                  onBlur={(e) => handleInputChange(e, setErrorCallback)}
                  fullWidth
                  margin="normal"
                />
                <div
                  style={{ color: "red", fontSize: "13px", marginLeft: "3px" }}
                >
                  <span>{err.email_id}</span>
                </div>
                <TextField
                  label="User Name"
                  name="user_name"
                  value={editedUserData.user_name}
                  onChange={(e) => handleInputChange(e, setErrorCallback)}
                  onBlur={(e) => handleInputChange(e, setErrorCallback)}
                  fullWidth
                  margin="normal"
                />
                <div
                  style={{ color: "red", fontSize: "13px", marginLeft: "3px" }}
                >
                  <span>{err.user_name}</span>
                </div>
                <TextField
                  label="Mobile Number"
                  name="mobile_number"
                  value={editedUserData.mobile_number}
                  onChange={(e) => handleInputChange(e, setErrorCallback)}
                  onBlur={(e) => handleInputChange(e, setErrorCallback)}
                  fullWidth
                  margin="normal"
                />
                <div
                  style={{ color: "red", fontSize: "13px", marginLeft: "3px" }}
                >
                  <span>{err.mobile_number}</span>
                </div>
                <TextField
                  label="Company Name"
                  name="company_name"
                  value={editedUserData.company_name}
                  onChange={(e) => handleInputChange(e, setErrorCallback)}
                  onBlur={(e) => handleInputChange(e, setErrorCallback)}
                  fullWidth
                  margin="normal"
                />
                <div
                  style={{ color: "red", fontSize: "13px", marginLeft: "3px" }}
                >
                  <span>{err.company_name}</span>
                </div>
                <TextField
                  label="Company Level Permissions"
                  select
                  name="company_level_permissions"
                  value={editedUserData.company_level_permissions || ""}
                  onChange={(e) => {
                    const { value } = e.target;
                    const newValue = value === "" ? [] : [value];
                    setFieldValue("company_level_permissions", newValue);
                  }}
                  onBlur={(e) =>
                    setFieldValue(
                      "company_level_permissions",
                      Array.isArray(e.target.value)
                        ? e.target.value.map((val) =>
                            typeof val === "string" ? val.trim() : val
                          )
                        : e.target.value
                    )
                  }
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="">--select--</MenuItem>
                  {companyLevelPermissions.map((permission) => (
                    <MenuItem key={permission} value={permission}>
                      {permission}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Password"
                  type="password"
                  name="password"
                  value={editedUserData.password}
                  onChange={(e) => handleInputChange(e, setErrorCallback)}
                  onBlur={(e) => handleInputChange(e, setErrorCallback)}
                  fullWidth
                  margin="normal"
                />
                <div
                  style={{ color: "red", fontSize: "13px", marginLeft: "3px" }}
                >
                  <span>{err.password}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 20,
                  }}
                >
                  <Button
                    onClick={handleCloseModal}
                    color="secondary"
                    variant="contained"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    style={{ marginLeft: 10 }}
                  >
                    Save
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Paper>
      </Modal>
      <Modal
        open={openCreateModal}
        onClose={handleCreateModalClose}
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
          <h2>Create User</h2>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, setFieldValue, values }) => (
              <Form>
                <Field
                  as={TextField}
                  label="Email"
                  name="email_id"
                  fullWidth
                  margin="normal"
                  error={errors.email_id && touched.email_id}
                  helperText={
                    errors.email_id && touched.email_id ? errors.email_id : null
                  }
                />
                <Field
                  as={TextField}
                  label="User Name"
                  name="user_name"
                  fullWidth
                  margin="normal"
                  error={errors.user_name && touched.user_name}
                  helperText={
                    errors.user_name && touched.user_name
                      ? errors.user_name
                      : null
                  }
                />
                <Field
                  as={TextField}
                  label="Mobile Number"
                  name="mobile_number"
                  fullWidth
                  margin="normal"
                  error={errors.mobile_number && touched.mobile_number}
                  helperText={
                    errors.mobile_number && touched.mobile_number
                      ? errors.mobile_number
                      : null
                  }
                />
                <Field
                  as={TextField}
                  label="Company Name"
                  name="company_name"
                  fullWidth
                  margin="normal"
                  error={errors.company_name && touched.company_name}
                  helperText={
                    errors.company_name && touched.company_name
                      ? errors.company_name
                      : null
                  }
                />
                <Field
                  as={TextField}
                  select
                  label="Company Level Permissions"
                  name="company_level_permissions"
                  fullWidth
                  margin="normal"
                  error={
                    errors.company_level_permissions &&
                    touched.company_level_permissions
                  }
                  helperText={
                    errors.company_level_permissions &&
                    touched.company_level_permissions
                      ? errors.company_level_permissions
                      : null
                  }
                  value={values.company_level_permissions || []}
                  onChange={(e) => {
                    const { value } = e.target;
                    const newValue = value === "" ? [] : [value];
                    setFieldValue("company_level_permissions", newValue);
                  }}
                >
                  <MenuItem value="">--select--</MenuItem>
                  {companyLevelPermissions.map((permission) => (
                    <MenuItem key={permission} value={permission}>
                      {permission}
                    </MenuItem>
                  ))}
                </Field>

                <Field
                  as={TextField}
                  type={showToken ? "text" : "password"}
                  label="Password"
                  name="password"
                  fullWidth
                  margin="normal"
                  error={errors.password && touched.password}
                  helperText={
                    errors.password && touched.password ? errors.password : null
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={ClicksendTokenVisibility}>
                          {showToken ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Grid
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 20,
                  }}
                >
                  <Button
                    onClick={handleCreateModalClose}
                    color="secondary"
                    variant="contained"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    style={{ marginLeft: 10 }}
                  >
                    Create
                  </Button>
                </Grid>
              </Form>
            )}
          </Formik>
        </Paper>
      </Modal>
      <Modal
        open={openConfirmationModal}
        onClose={handleConfirmationModalClose}
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
            width: isSmallScreen ? "80%" : "30%",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <h5>Are you sure you want to update?</h5>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Button
              onClick={handleConfirmationModalClose}
              color="secondary"
              variant="contained"
              size="small"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSaveChanges}
              variant="contained"
              color="primary"
              style={{ marginLeft: 10 }}
              size="small"
            >
              Yes, Update
            </Button>
          </div>
        </Paper>
      </Modal>
      <Modal
        open={openDeleteConfirmationModal}
        onClose={handleDeleteConfirmationModalClose}
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
            width: isSmallScreen ? "80%" : "30%",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <h5>Are you sure you want to delete this user?</h5>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 20,
            }}
          >
            <Button
              onClick={handleDeleteConfirmationModalClose}
              color="secondary"
              variant="contained"
              size="small"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="primary"
              style={{ marginLeft: 10 }}
              size="small"
            >
              Yes, Delete
            </Button>
          </div>
        </Paper>
      </Modal>
    </>
  );
};

export default SuperAdminUser;
