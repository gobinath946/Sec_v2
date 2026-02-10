import React from "react";
import { styled } from "@mui/system";
import { Typography } from "@mui/material";

const StyledCard = styled("div")(({ theme }) => ({
  position: "relative",
  marginBottom: "30px",
  flexBasis: "calc(33.33333% - 30px)",
  height: "160px",
  margin: "0 15px",
  overflow: "hidden",
  borderRadius: "28px",
  "&:hover .date": {
    textDecoration: "none",
    color: "#FFF",
  },
  "&:hover .count": {
    textDecoration: "none",
    color: "black",
  },
  "&:hover .title": {
    textDecoration: "none",
    color: "black",
  },
  "&:hover .bg": {
    transform: "scale(10)",
  },
  [theme.breakpoints.down("md")]: {
    flexBasis: "calc(50% - 30px)",
  },
  [theme.breakpoints.down("sm")]: {
    width: "80%",
    flexBasis: "100%",
  },
}));

const StyledLink = styled("div")(({ theme }) => ({
  display: "block",
  padding: "30px 20px",
  backgroundColor: "#121212",
  overflow: "hidden",
  position: "relative",
}));

const Background = styled("div")({
  height: "128px",
  width: "128px",
  backgroundColor: "#74b49b",
  zIndex: 1,
  position: "absolute",
  top: "-75px",
  right: "-75px",
  borderRadius: "50%",
  transition: "all .5s ease",
});

const Title = styled(Typography)(({ theme }) => ({
  minHeight: "50px",
  overflow: "hidden",
  fontWeight: "bold",
  fontSize: "20px",
  color: "#FFF",
  zIndex: 2,
  position: "relative",
}));

const DateBox = styled("div")({
  fontSize: "20px",
  color: "#FFF",
  zIndex: 2,
  position: "relative",
  textAlign: "center",
});

const Date = styled("span")({
  fontWeight: "bold",
  fontSize: "35px",
  color: "whitesmoke",
  transition: "color .5s ease",
});

const CourseCard = ({ title, count = 0 }) => {
  return (
    <StyledCard>
      <StyledLink href="#" className="date">
        <Background className="bg" />
        <Title className="title">{title}</Title>
        <DateBox>
          <Date className="count">{count}</Date>
        </DateBox>
      </StyledLink>
    </StyledCard>
  );
};

export default CourseCard;
