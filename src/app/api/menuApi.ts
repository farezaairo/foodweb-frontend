import axios from "axios";

const API_URL =
  "https://foodweb-backend-production.up.railway.app/api/menu";
// ganti dengan URL backend nanti

export const getMenus = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createMenu = async (menu: any) => {
  const res = await axios.post(API_URL, menu);
  return res.data;
};

export const updateMenu = async (id: string, menu: any) => {
  const res = await axios.put(`${API_URL}/${id}`, menu);
  return res.data;
};

export const deleteMenu = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};