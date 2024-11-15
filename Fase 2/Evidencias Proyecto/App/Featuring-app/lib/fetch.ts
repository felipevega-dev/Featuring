export const fetchAPI = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`); // Cambié `new Error` a `throw new Error`
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error; // Esto es para propagar el error al llamador
  }
};
