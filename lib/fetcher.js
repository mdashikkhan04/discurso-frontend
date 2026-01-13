"use client";
import { refreshToken } from "@/lib/client/auth";


export const fetcher = {
  /**
   * Performs a GET request.
   * @param {string} url - The API endpoint.
   * @returns {Promise<{ ok: boolean, data?: any, error?: string }>}
   */
  async get(url, user) {
    // console.log("get()", url);
    const bValidSession = await assureSession(url, user);
    if (!bValidSession) return getLoginRedirect();
    // if (!(await assureSession(url, user))) return getLoginRedirect();
    // console.log("get() going though", url);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!response.ok) {
        // if (true) {
        // return getLoginRedirect(response.status);
        if (response.status == 401) return getLoginRedirect(response.status, true);
        return { code: response.status, ok: false, error: result?.error || response.statusText };
      }

      return { code: response.status, ok: true, result };
    } catch (error) {
      console.error("GET request failed:", error);
      return { ok: false, error: error.message };
    }
  },

  /**
   * Performs a POST request.
   * @param {string} url - The API endpoint.
   * @param {Object} body - The request payload.
   * @returns {Promise<{ ok: boolean, data?: any, error?: string }>}
   */
  async post(url, body, user) {
    // console.log("post()", url, body);
    const bValidSession = await assureSession(url, user);
    if (!bValidSession) return getLoginRedirect();
    // if (!(await assureSession(url, user))) return getLoginRedirect();
    // console.log("post() going though", url);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        // return getLoginRedirect(response.status);
        // if (response.status == 401) return getLoginRedirect(response.status, true);
        if (response.status == 401) return getLoginRedirect(response.status);
        return { code: response.status, ok: false, error: result?.error || response.statusText };
      }

      return { code: response.status, ok: true, result };
    } catch (error) {
      console.error("POST request failed:", error);
      return { ok: false, error: error.message };
    }
  },

  /**
   * Performs a DELETE request.
   * @param {string} url - The API endpoint.
   * @returns {Promise<{ ok: boolean, data?: any, error?: string }>}
   */
  async delete(url, user) {
    // if (!(await assureSession(url, user))) return getLoginRedirect();
    const bValidSession = await assureSession(url, user);
    if (!bValidSession) return getLoginRedirect();
    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      if (!response.ok) {
        // return getLoginRedirect(response.status);
        // if (response.status == 401) return getLoginRedirect(response.status, true);
        if (response.status == 401) return getLoginRedirect(response.status);
        return { code: response.status, ok: false, error: result?.error || response.statusText };
      }

      return { ok: true, result };
    } catch (error) {
      console.error("DELETE request failed:", error);
      return { code: response.status, ok: false, error: error.message };
    }
  },
};

function getLoginRedirect(status, withRedirect) {
  // window.location.href = "/signin";
  // window.location.href = `/signin${withRedirect ? "?redirect=" + window.location.href : ""}`;
  window.location.href = `/signin?auth=true${withRedirect ? "&redirect=" + window.location.href : ""}`;
  return { code: status, ok: false };
}

async function assureSession(url, user) {
  // console.log("assureSession()", url, user);
  let goodSession = true;
  if (!user) return goodSession;
  if (url.startsWith("/api/auth/login") || url.startsWith("/api/auth/cookies") || url.startsWith("/api/auth/terms")) return goodSession;
  const newToken = await refreshToken();
  if (newToken) goodSession = true;
  console.debug("Session status", goodSession);
  return goodSession;
}
