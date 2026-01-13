"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import react-toastify styles

const ToastProvider = ({ children }) => {
  return (
    <>
      <ToastContainer
        position="top-right" // Position of the toast
        autoClose={3000} // Duration before toast auto closes
        hideProgressBar={false} // Show progress bar
        newestOnTop={true} // Stack toasts from bottom to top
        closeButton // Show close button
        draggable // Allow dragging to dismiss
      />
      {children}
    </>
  );
};

export default ToastProvider;
