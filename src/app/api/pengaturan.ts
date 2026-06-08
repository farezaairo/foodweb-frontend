import axios from "axios";

const API_URL = "https://foodweb-backend-production.up.railway.app/api/pengaturan";

// Mengambil pengaturan restoran dari MongoDB
export const getSettings = async () => {
  const response = await axios.get(API_URL);
  // Jika data berbentuk array, ambil indeks ke-0 (karena dokumen pengaturan cuma ada 1)
  return Array.isArray(response.data) ? response.data[0] : response.data;
};

// Memperbarui pengaturan berdasarkan ID dokumen ke cloud Railway
export const updateSettings = async (id: string, data: any) => {
  // Menembak URL endpoint spesifik: /api/pengaturan/:id
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};