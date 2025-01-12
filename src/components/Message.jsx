import React from "react";

const Message = ({ type, message }) => {
  const bgColor = type === "success" ? "bg-green-100" : "bg-red-100";
  const textColor = type === "success" ? "text-green-800" : "text-red-800";
  const borderColor =
    type === "success" ? "border-green-400" : "border-red-400";

  return (
    <div
      className={`${bgColor} ${textColor} ${borderColor} border-l-4 p-4 mb-4 rounded-r`}
      role="alert"
    >
      <p>{message}</p>
    </div>
  );
};

export default Message;
