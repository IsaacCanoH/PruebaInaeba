import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import DashboardHeader from "../components/Empleado/DashboardHeader"
import DashboardTabs from "../components/Empleado/DashboardTabs"
import QRModal from "../components/Empleado/QRModal"
import VerificationModal from "../components/Empleado/VerificationModal"
import IncidenciaModal from "../components/Empleado/IncidenciaModal"
import styles from "../styles/dashboard.module.css"
import "bootstrap/dist/css/bootstrap.min.css"
import { obtenerAsistenciasPorUsuario, guardarAsistenciasOffline, obtenerAsistenciasOffline } from "../services/dashboard/asistenciasService"
import { crearIncidencia } from "../services/dashboard/incidentsService"
import { useToast } from "../context/ToastContext"
import { CheckCircle, XCircle, Bell, Info, AlertTriangle } from "lucide-react"
import FaceRecognitionModal from "../components/Empleado/FaceRecognitionModal"

const DashboardPage = () => {
  const navigate = useNavigate()
  const notificationRef = useRef(null)
  const { showSuccess, showError } = useToast()

  // ---------------------------- Validar Sesión ----------------------------
  const storedUser = localStorage.getItem("usuario")
  const usuarioData = storedUser ? JSON.parse(storedUser) : null

  const usuario = usuarioData?.user
  const isOffline = usuarioData?.offline === true

  useEffect(() => {
    if (!usuario) {
      navigate("/login", { replace: true })
    }
  }, [usuario, navigate])

  // ---------------------------- Notificaciones ----------------------------
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const unreadCount = notifications.filter((n) => !n.leida).length

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case "success":
        return <CheckCircle size={18} className="text-success" />
      case "warning":
        return <AlertTriangle size={18} className="text-warning" />
      case "error":
        return <XCircle size={18} className="text-danger" />
      case "info":
        return <Info size={18} className="text-info" />
      default:
        return <Bell size={18} className="text-muted" />
    }
  }

  const getNotificationBadgeColor = (tipo) => {
    switch (tipo) {
      case "success":
        return "bg-success"
      case "warning":
        return "bg-warning"
      case "error":
        return "bg-danger"
      case "info":
        return "bg-info"
      default:
        return "bg-secondary"
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("usuario")
    navigate("/login")
  }

  // ---------------------------- Tabs / Panel Principal ----------------------------
  const [activeTab, setActiveTab] = useState("asistencias")
  const [historialAsistencias, setHistorialAsistencias] = useState([])
  const [estadisticas, setEstadisticas] = useState({})

  useEffect(() => {
    const cargarAsistencias = async () => {
      if (!usuario) return

      let datosAsistencia = []

      if (isOffline) {
        datosAsistencia = await obtenerAsistenciasOffline(usuario.empleado_id)
      } else {
        datosAsistencia = await obtenerAsistenciasPorUsuario(usuario.empleado_id)
        await guardarAsistenciasOffline(datosAsistencia)
      }

      const agrupado = {}
      datosAsistencia.forEach((registro) => {
        const fecha = new Date(registro.fecha_hora_registro)
        const dia = fecha.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        const hora = `${fecha.getUTCHours().toString().padStart(2, "0")}:${fecha
          .getUTCMinutes()
          .toString()
          .padStart(2, "0")}`

        if (!agrupado[dia]) {
          agrupado[dia] = {
            entrada: "",
            salida: "",
            horas: "00:00",
            estado: "",
            fecha: dia,
          }
        }

        if (registro.tipo === "entrada") {
          if (!agrupado[dia].entrada || fecha < new Date(`${dia} ${agrupado[dia].entrada}`)) {
            agrupado[dia].entrada = hora
            agrupado[dia].estado = registro.condicion
          }
        } else if (registro.tipo === "salida") {
          if (!agrupado[dia].salida || fecha > new Date(`${dia} ${agrupado[dia].salida}`)) {
            agrupado[dia].salida = hora
          }
        }
      })

      const finalData = Object.values(agrupado).map((item) => {
        if (item.entrada && item.salida) {
          const [h1, m1] = item.entrada.split(":").map(Number)
          const [h2, m2] = item.salida.split(":").map(Number)
          const entradaDate = new Date(0, 0, 0, h1, m1)
          const salidaDate = new Date(0, 0, 0, h2, m2)
          const diffMs = salidaDate - entradaDate
          const horas = Math.floor(diffMs / 3600000)
          const minutos = Math.floor((diffMs % 3600000) / 60000)
          item.horas = `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`
        }
        return item
      })

      setHistorialAsistencias(finalData)

      // Estadísticas
      const total = finalData.length
      const totalAsistencias = finalData.filter((f) => f.estado === "puntual").length
      const retardos = finalData.filter((f) => f.estado === "retardo").length
      const faltas = finalData.filter((f) => f.estado === "falta").length
      const porcentaje = total > 0 ? Math.round((totalAsistencias / total) * 100) : 0

      setEstadisticas({
        asistencias: totalAsistencias,
        retardos,
        faltas,
        porcentaje,
      })
    }

    cargarAsistencias()
  }, [usuario, isOffline])

  const registrarAsistencia = () => {
    handleOpenCamera()
  }

  // ---------------------------- Modal QR ----------------------------
  const [showQRModal, setShowQRModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [qrDetectado, setQrDetectado] = useState(null); // Guarda el QR escaneado

  const handleOpenCamera = useCallback(() => {
    setCameraActive(true);
    setShowQRModal(true);
  }, []);

  const handleCloseCamera = useCallback(() => {
    setCameraActive(false);
    setShowQRModal(false);
  }, []);

  // Al detectar el QR lo guardamos, pero NO lo procesamos aún
  const handleScanSuccess = useCallback((qrText) => {
    console.log("QR detectado:", qrText);
    setQrDetectado(qrText);

    setShowQRModal(false);   // Cierra modal QR
    setShowFaceModal(true);  // Abre reconocimiento facial
  }, []);

  // Si la verificación facial es exitosa, mostramos éxito con el QR leído
  const handleFaceSuccess = () => {
    setShowFaceModal(false);

    if (qrDetectado) {
      showSuccess(`QR leído correctamente: ${qrDetectado}`);
      console.log("QR validado después de rostro:", qrDetectado);
      setQrDetectado(null); // Limpiamos el QR detectado
    }
  };

  // Si falla la verificación facial, descartamos el QR
  const handleFaceFailure = () => {
    setShowFaceModal(false);
    setQrDetectado(null);
    showError("Falló la autenticación facial");
  };

  // ---------------------------- Modal Incidencia ----------------------------
  const [showIncidenciaModal, setShowIncidenciaModal] = useState(false)
  const [incidenciaForm, setIncidenciaForm] = useState({
    tipo: "",
    descripcion: "",
    fecha_incidencia: "",
    evidencias: [],
  })

  const handleIncidenciaChange = (e) => {
    const { name, value } = e.target
    setIncidenciaForm({ ...incidenciaForm, [name]: value })
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    setIncidenciaForm({
      ...incidenciaForm,
      evidencias: [...incidenciaForm.evidencias, ...files],
    })
  }

  const handleSubmitIncidencia = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("usuario_id", usuario?.empleado_id)
    formData.append("tipo_incidencia", incidenciaForm.tipo)
    formData.append("descripcion", incidenciaForm.descripcion)
    formData.append("fecha_incidencia", incidenciaForm.fecha_incidencia)

    incidenciaForm.evidencias.forEach((file) => {
      formData.append("archivos", file)
    })

    try {
      await crearIncidencia(formData)

      showSuccess("Incidencia registrada correctamente")
      setShowIncidenciaModal(false)
      setIncidenciaForm({
        tipo: "",
        descripcion: "",
        fecha_incidencia: "",
        evidencias: [],
      })
    } catch (error) {
      showError("Error al registrar la incidencia")
      console.error(error)
    }
  }

  // ---------------------------- Render ----------------------------

  return (
    <div className="bg-light min-vh-100">
      <DashboardHeader
        usuario={usuario}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notificationRef={notificationRef}
        notifications={notifications}
        markAllAsRead={markAllAsRead}
        markAsRead={markAsRead}
        deleteNotification={deleteNotification}
        getNotificationIcon={getNotificationIcon}
        getNotificationBadgeColor={getNotificationBadgeColor}
        styles={styles}
        handleLogout={handleLogout}
      />

      <div className="container-fluid px-4 py-4">
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          historialAsistencias={historialAsistencias}
          estadisticas={estadisticas}
          setShowIncidenciaModal={setShowIncidenciaModal}
          usuario={usuario}
          registrarAsistencia={registrarAsistencia}
          setShowQRModal={setShowQRModal}
          isOffline={isOffline}
          styles={styles}
        />
      </div>

      {showQRModal && (
        <QRModal
          handleOpenCamera={handleOpenCamera}
          handleCloseCamera={handleCloseCamera}
          cameraActive={cameraActive}
          onScanSuccess={handleScanSuccess}
          styles={styles}
        />
      )}

      {showIncidenciaModal && (
        <IncidenciaModal
          incidenciaForm={incidenciaForm}
          handleIncidenciaChange={handleIncidenciaChange}
          handleFileUpload={handleFileUpload}
          handleSubmitIncidencia={handleSubmitIncidencia}
          setShowIncidenciaModal={setShowIncidenciaModal}
          styles={styles}
        />
      )}

      <FaceRecognitionModal
        show={showFaceModal}
        onSuccess={handleFaceSuccess}
        onFailure={handleFaceFailure}
        usuario={usuario}
        onClose={() => setShowFaceModal(false)}
      />

    </div>
  )
}

export default DashboardPage