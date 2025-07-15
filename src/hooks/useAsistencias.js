import { useState, useEffect } from "react";
import { obtenerAsistenciasPorUsuario, guardarAsistenciasOffline, obtenerAsistenciasOffline } from "../services/dashboard/asistenciasService";

export const useAsistencias = (usuario, isOffline) => {
  const [historialAsistencias, setHistorialAsistencias] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});

  useEffect(() => {
    const cargarAsistencias = async () => {
      if (!usuario) return;

      let datosAsistencia = [];

      if (isOffline) {
        datosAsistencia = await obtenerAsistenciasOffline(usuario.empleado_id);
      } else {
        datosAsistencia = await obtenerAsistenciasPorUsuario(usuario.empleado_id);
        await guardarAsistenciasOffline(datosAsistencia);
      }

      const agrupado = {};
      datosAsistencia.forEach((registro) => {
        const fecha = new Date(registro.fecha_hora_registro);
        const dia = fecha.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const hora = `${fecha.getUTCHours().toString().padStart(2, "0")}:${fecha
          .getUTCMinutes()
          .toString()
          .padStart(2, "0")}`;

        if (!agrupado[dia]) {
          agrupado[dia] = {
            entrada: "",
            salida: "",
            horas: "00:00",
            estado: "",
            fecha: dia,
          };
        }

        if (registro.tipo === "entrada") {
          if (!agrupado[dia].entrada || fecha < new Date(`${dia} ${agrupado[dia].entrada}`)) {
            agrupado[dia].entrada = hora;
            agrupado[dia].estado = registro.condicion;
          }
        } else if (registro.tipo === "salida") {
          if (!agrupado[dia].salida || fecha > new Date(`${dia} ${agrupado[dia].salida}`)) {
            agrupado[dia].salida = hora;
          }
        }
      });

      const finalData = Object.values(agrupado).map((item) => {
        if (item.entrada && item.salida) {
          const [h1, m1] = item.entrada.split(":").map(Number);
          const [h2, m2] = item.salida.split(":").map(Number);
          const entradaDate = new Date(0, 0, 0, h1, m1);
          const salidaDate = new Date(0, 0, 0, h2, m2);
          const diffMs = salidaDate - entradaDate;
          const horas = Math.floor(diffMs / 3600000);
          const minutos = Math.floor((diffMs % 3600000) / 60000);
          item.horas = `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`;
        }
        return item;
      });

      setHistorialAsistencias(finalData);

      // Estadísticas
      const total = finalData.length;
      const totalAsistencias = finalData.filter((f) => f.estado === "puntual").length;
      const retardos = finalData.filter((f) => f.estado === "retardo").length;
      const faltas = finalData.filter((f) => f.estado === "falta").length;
      const porcentaje = total > 0 ? Math.round((totalAsistencias / total) * 100) : 0;

      setEstadisticas({
        asistencias: totalAsistencias,
        retardos,
        faltas,
        porcentaje,
      });
    };

    cargarAsistencias();
  }, [usuario, isOffline]);

  return {
    historialAsistencias,
    estadisticas,
  };
};
