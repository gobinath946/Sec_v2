import React, { useState, useEffect } from "react";
import { Grid, Select, MenuItem, TextField, Typography } from "@mui/material";
import axios from "axios";
import { BASE_URL } from "../../../config";
import { useNavigate } from "react-router-dom";
import CourseCard from "../../../Lib/CourseCard";

import { useSnackbar } from "notistack";
import { apiEndPoint } from "../../../Service/ApiConstant";
import Controller from "../../../Service/ApiController";

const DashBoard = ({ uid }) => {
  const [selectedDateRange, setSelectedDateRange] = useState("today");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({});
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const email = sessionStorage.getItem("email_id");
  const userUid = uid;
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    fetchDataForDateRange(selectedDateRange);
  }, [selectedDateRange]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, userUid]);

  const fetchData = async () => {
    try {
      const result = await Controller.ApiController(
        "",
        apiEndPoint.DASHBOARD,
        "GET",
        {
          customer_id: userUid,
          fromDate: startDate.toISOString().split("T")[0],
          toDate: endDate.toISOString().split("T")[0],
        }
      );
      if (result.success === true) {
        setDashboardData(result.data);
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
      console.error("Sms Config", error);
    }
  };

  const fetchDataForDateRange = (range) => {
    switch (range) {
      case "today":
        setStartDate(new Date());
        setEndDate(new Date());
        break;
      case "yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case "past_week":
        const pastWeekStart = new Date();
        pastWeekStart.setDate(pastWeekStart.getDate() - 6);
        setStartDate(pastWeekStart);
        setEndDate(new Date());
        break;
      case "past_month":
        const pastMonthStart = new Date();
        pastMonthStart.setMonth(pastMonthStart.getMonth() - 1);
        pastMonthStart.setDate(1);
        setStartDate(pastMonthStart);
        setEndDate(new Date());
        break;
      default:
        break;
    }
  };

  const handleDateRangeChange = (event) => {
    const selectedRange = event.target.value;
    setSelectedDateRange(selectedRange);
  };

  const handleStartDateChange = (event) => {
    const date = new Date(event.target.value);
    setStartDate(date);
  };

  const handleEndDateChange = (event) => {
    const date = new Date(event.target.value);
    setEndDate(date);
  };

  return (
    <Grid>
      <Grid style={{ padding: 5 }}>
        <Grid
          container
          spacing={1}
          mt={2}
          gap={2}
          display={"flex"}
          justifyContent={"flex-end"}
          alignItems={"center"}
        >
          <p>
            <span style={{ fontWeight: "bold", fontSize: "20px" }}>
              Total Available Credit's =
            </span>{" "}
            <span style={{ fontWeight: "bolder", fontSize: "20px" }}>
              {" "}
              {dashboardData.MasterCredits}
            </span>
          </p>

          <Select
            value={selectedDateRange}
            onChange={handleDateRangeChange}
            variant="outlined"
            style={{ marginBottom: 10 }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="yesterday">Yesterday</MenuItem>
            <MenuItem value="past_week">Past Week</MenuItem>
            <MenuItem value="past_month">Past Month</MenuItem>
            <MenuItem value="date_range">Custom Range</MenuItem>
          </Select>

          {selectedDateRange === "date_range" && (
            <>
              <TextField
                label="From Date"
                type="date"
                value={startDate.toISOString().split("T")[0]}
                onChange={handleStartDateChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                style={{ marginBottom: 10 }}
              />

              <TextField
                label="To Date"
                type="date"
                value={endDate.toISOString().split("T")[0]}
                onChange={handleEndDateChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                style={{ marginBottom: 10 }}
              />
            </>
          )}
        </Grid>

        <Grid container spacing={1} mt={2}>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard
              title="Master Count"
              count={dashboardData.masterCount}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard title="Sms Count" count={dashboardData.totalSMSCount} />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard
              title="Email Count"
              count={dashboardData.totalEmailCount}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard
              title="Exhausted Credit Count"
              count={dashboardData.totalCreditCount}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard
              title="Purchased Credit Count"
              count={dashboardData.totalPurchasedCount}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard
              title="Short Link Count"
              count={dashboardData.shortenLinkCount}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard
              title="In Progress Count"
              count={dashboardData.inProgress}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
            <CourseCard title="Closed Count" count={dashboardData.closed} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DashBoard;
