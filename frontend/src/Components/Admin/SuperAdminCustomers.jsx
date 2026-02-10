import React, { useEffect, useState } from "react";
import axios from "axios";
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
  Container,
} from "@mui/material";
import CustomerSettingAccordion from "./CustomerSettingsAccordion";

import { useSnackbar } from "notistack";
import { apiEndPoint } from "../../Service/ApiConstant";
import Controller from "../../Service/ApiController";

const SuperAdminCustomers = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const fetchData = async (page) => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.CUSTOMERS_DATA + page,
        "GET"
      );
      if (result.success === true) {
        setUsers(result.data.customers);
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
      console.error("Super Admin Customer", error);
    }
  };
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleBackToList = () => {
    setSelectedCustomer(null);
  };

  return (
    <>
      <Grid style={{ textAlign: "center" }}>
        <h3>Customer Management</h3>
      </Grid>
      {!selectedCustomer ? (
        <Grid style={{ marginTop: "20px" }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S.no</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>User Name</TableCell>
                  <TableCell>Mobile Number</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((customer, index) => (
                  <TableRow key={customer.uid}>
                    <TableCell>{(currentPage - 1) * 5 + index + 1}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.mobile}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
      ) : (
        <CustomerDetails
          customer={selectedCustomer}
          onBack={handleBackToList}
        />
      )}
    </>
  );
};

const CustomerDetails = ({ customer, onBack }) => {
  return (
    <Grid>
      <Grid
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Button variant="contained" color="primary" onClick={onBack}>
          Back to List
        </Button>
      </Grid>

      <Container>
        <CustomerSettingAccordion customer_id={customer.uid} />
      </Container>
    </Grid>
  );
};

export default SuperAdminCustomers;
