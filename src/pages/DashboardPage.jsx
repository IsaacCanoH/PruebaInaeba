import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/Empleado/DashboardHeader";
import DashboardTabs from "../components/Empleado/DashboardTabs";
import QRModal from "../components/Empleado/QRModal";
import VerificationModal from "../components/Empleado/VerificationModal";
import IncidenciaModal from "../components/Empleado/IncidenciaModal";
import FaceRecognitionModal from "../components/Empleado/FaceRecognitionModal";
import styles from "../styles/dashboard.module.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Hooks y contextos personalizados
import { useNotifications } from "../context/NotificationContext";
import { useQrAndFace } from "../hooks/useQrAndFace";
import { useIncidencia } from "../hooks/useIncidencia";
import { useAsistencias } from "../hooks/useAsistencias";

const DashboardPage = () => {
  const navigate = useNavigate();

  //---------------------------- Autenticación ----------------------------
  const storedUser = localStorage.getItem("usuario");
  const usuarioData = storedUser ? JSON.parse(storedUser) : null;
  const usuario = usuarioData?.user;
  const isOffline = usuarioData?.offline === true;

  useEffect(() => {
    if (!usuario) {
      navigate("/login", { replace: true });
    }
  }, [usuario, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  //---------------------------- Notificaciones (context) ----------------------------
  const {
    notificationRef,
    showNotifications,
    setShowNotifications,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationBadgeColor,
  } = useNotifications();

  //---------------------------- Asistencias (hook) ----------------------------
  const [activeTab, setActiveTab] = useState("asistencias");
  const { historialAsistencias, estadisticas } = useAsistencias(usuario, isOffline);

  //---------------------------- QR + Reconocimiento facial (hook) ----------------------------
  const {
    showQRModal,
    setShowQRModal,
    cameraActive,
    showFaceModal,
    handleOpenCamera,
    handleCloseCamera,
    handleScanSuccess,
    handleFaceSuccess,
    handleFaceFailure,
  } = useQrAndFace();

  const registrarAsistencia = () => {
    handleOpenCamera();
  };

  //---------------------------- Incidencias (hook) ----------------------------
  const {
    showIncidenciaModal,
    setShowIncidenciaModal,
    incidenciaForm,
    handleIncidenciaChange,
    handleFileUpload,
    handleSubmitIncidencia,
  } = useIncidencia(usuario);

  //---------------------------- Render ----------------------------
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
        onClose={() => handleFaceFailure()}
      />
    </div>
  );
};

export default DashboardPage;
