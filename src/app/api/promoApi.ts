import axios from "axios";

const API_URL =
  "https://foodweb-backend-production.up.railway.app/api/promos";

export const getPromos = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createPromo = async (promo: any) => {
  const res = await axios.post(API_URL, promo);
  return res.data;
};

export const updatePromo = async (id: string, promo: any) => {
  const res = await axios.put(`${API_URL}/${id}`, promo);
  return res.data;
};

export const deletePromo = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};