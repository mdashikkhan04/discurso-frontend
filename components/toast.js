"use client";

import { toast } from "react-toastify";

// Function to show a success toast message
export const showSuccessToast = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 10000,
    hideProgressBar: false,
    closeButton: true,
  });
};

export const showInfoToast = (message) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 10000,
    hideProgressBar: false,
    closeButton: true,
  });
};
// Function to show an error toast message
export const showErrorToast = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 10000,
    hideProgressBar: false,
    closeButton: true,
  });
};

// Function to show a warning toast message
export const showWarnToast = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 10000,
    hideProgressBar: false,
    closeButton: true,
  });
};
