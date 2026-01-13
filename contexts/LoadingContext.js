"use client";

import React, { createContext, useContext, useState } from "react";
import LoadingOverlay from "@/components/LoadingOverlay";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Functions to control the loading state
  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingOverlay />} {/* Display overlay when loading */}
    </LoadingContext.Provider>
  );
};

// Custom hook to use the LoadingContext
export const useLoading = () => useContext(LoadingContext);
