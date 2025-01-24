import { FC } from "react";
import { ErrorMessageProps } from "../types/type";

const ErrorMessage: FC<ErrorMessageProps> = ({ message }) => {
  return <div style={{ color: "red", marginTop: "1rem" }}>{message}</div>;
};

export default ErrorMessage;
