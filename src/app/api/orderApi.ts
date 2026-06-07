import axios from "axios";

const API_URL =
  "https://foodweb-backend-production.up.railway.app/api/orders";

export const getOrders = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const getOrder = async (id: string) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const createOrder = async (order: any) => {
  const res = await axios.post(API_URL, order);
  return res.data;
};

export const updateOrder = async (
  id: string,
  data: any
) => {
  const res = await axios.put(
    `${API_URL}/${id}`,
    data
  );

  return res.data;
};

export const deleteOrder = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

// Tambahkan fungsi ini di paling bawah file orderApi.ts
export const updateOrderStatus = async (id: string, status: string) => {
  // Fungsi ini memanfaatkan fungsi updateOrder yang sudah Anda buat di atas,
  // dengan mengirimkan objek berisi status baru ke backend.
  return await updateOrder(id, { status });
};