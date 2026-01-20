/**
 * RENDER DEPLOYMENT CONFIGURATION
 * 1. Checks if the app is running on localhost or Render.
 * 2. Switch the Render URL below with your actual Backend Web Service URL.
 */
const BASE_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : "https://delightfood-r9vx.onrender.com/api"; 

/* ================= AUTH ================= */

export const registerUser = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

/* ================= MENU ================= */

export const fetchMenu = async () => {
  const res = await fetch(`${BASE_URL}/menu`);
  return res.json();
};

export const addMenuItem = async (item, token) => {
  const res = await fetch(`${BASE_URL}/menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(item),
  });
  return res.json();
};

/* ================= ORDER ================= */

export const placeOrder = async (order) => {
  const res = await fetch(`${BASE_URL}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  return res.json();
};

export const fetchOrders = async (token) => {
  const res = await fetch(`${BASE_URL}/order`, {
    headers: { Authorization: token },
  });
  return res.json();
};

export const updateOrderStatus = async (id, status, token) => {
  const res = await fetch(`${BASE_URL}/order/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ status }),
  });
  return res.json();
};