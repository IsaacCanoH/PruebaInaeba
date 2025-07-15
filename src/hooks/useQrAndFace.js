import { useState, useCallback } from "react";
import { useToast } from "../context/ToastContext";

export const useQrAndFace = () => {
    const [showQRModal, setShowQRModal] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [qrDetectado, setQrDetectado] = useState(null);

    const { showSuccess, showError } = useToast();

    const handleOpenCamera = useCallback(() => {
        setCameraActive(true);
        setShowQRModal(true);
    }, []);

    const handleCloseCamera = useCallback(() => {
        setCameraActive(false);
        setShowQRModal(false);
    }, []);

    const handleScanSuccess = useCallback((qrText) => {
        console.log("QR detectado:", qrText);
        setQrDetectado(qrText);
        setShowQRModal(false);
        setShowFaceModal(true);
    }, []);

    const handleFaceSuccess = useCallback(() => {
        setShowFaceModal(false);

        if (qrDetectado) {
            showSuccess(`QR leído correctamente: ${qrDetectado}`);
            console.log("QR validado después de rostro:", qrDetectado);
            setQrDetectado(null);
        }
    }, [qrDetectado, showSuccess]);

    const handleFaceFailure = useCallback(() => {
        setShowFaceModal(false);
        setQrDetectado(null);
        showError("Falló la autenticación facial");
    }, [showError]);

    return {
        showQRModal,
        setShowQRModal,
        cameraActive,
        showFaceModal,
        handleOpenCamera,
        handleCloseCamera,
        handleScanSuccess,
        handleFaceSuccess,
        handleFaceFailure,
    };
};
