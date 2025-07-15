const API_URL = "https://backend-node-mjpn.onrender.com/api/notificacion";

export const crearNotificacion = async (data) => {
  try {
    const response = await fetch(`${API_URL}/crear-notificacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error al crear la notificación");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en crearNotificacion:", error);
    throw error;
  }
};

export const obtenerNotificacionesPorUsuario = async (usuario_id) => {
  try {
    const response = await fetch(`${API_URL}/${usuario_id}`);
    if (!response.ok) {
      throw new Error("Error al obtener las notificaciones");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en obtenerNotificacionesPorUsuario:", error);
    return [];
  }
};

export const marcarNotificacionComoLeida = async (notificacion_id) => {
  try {
    const response = await fetch(`${API_URL}/leer/${notificacion_id}`, {
      method: "PATCH",
    });
    if (!response.ok) {
      throw new Error("Error al marcar como leída");
    }
    return await response.json();
  } catch (error) {
    console.error("Error en marcarNotificacionComoLeida:", error);
    throw error;
  }
};
