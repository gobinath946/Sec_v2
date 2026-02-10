import React from "react";
import { MdMessage } from "react-icons/md";

const MessagingIconButton = ({ mobileNumber }) => {
  const smsURI = `sms:${mobileNumber}`;

  return (
    <>
      <a href={smsURI} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
        <MdMessage style={{ fontSize: "23px" }} color="grey" />
      </a>
    </>
  );
};

export default MessagingIconButton;
