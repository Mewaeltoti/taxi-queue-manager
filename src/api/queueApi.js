const BASE = import.meta.env.VITE_API_URL;

export const getQueue = async () => {
  const res = await fetch(`${BASE}/queue`);
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
};

export const addTaxiApi = async (data) => {
  const res = await fetch(`${BASE}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Add failed");
  return res.json();
};

export const removeTaxiApi = async (id) => {
  const res = await fetch(`${BASE}/queue/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Delete failed");
};
