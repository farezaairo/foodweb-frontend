import axios from "axios";

const API_URL = "https://foodweb-backend-production.up.railway.app/api/pengaturan";

export const getSettings = async () => {
  const response = await axios.get(API_URL);
  // Jika data berbentuk array, ambil indeks ke-0 (karena pengaturan biasanya hanya 1 dokumen)
  return Array.isArray(response.data) ? response.data[0] : response.data;
};

// Pastikan menerima (id, data)
export const updateSettings = async (id: string, data: any) => {
  // Menembak URL seperti: /api/pengaturan/6a25938d...
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data;
};