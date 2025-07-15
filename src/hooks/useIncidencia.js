import { useState } from "react";
import { crearIncidencia } from "../services/dashboard/incidentsService";
import { useToast } from "../context/ToastContext";

export const useIncidencia = (usuario) => {
    const { showSuccess, showError } = useToast();

    const [showIncidenciaModal, setShowIncidenciaModal] = useState(false);

    const [incidenciaForm, setIncidenciaForm] = useState({
        tipo: "",
        descripcion: "",
        fecha_incidencia: "",
        evidencias: [],
    });

    const handleIncidenciaChange = (e) => {
        const { name, value } = e.target;
        setIncidenciaForm({ ...incidenciaForm, [name]: value });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setIncidenciaForm((prev) => ({
            ...prev,
            evidencias: [...prev.evidencias, ...files],
        }));
    };

    const handleSubmitIncidencia = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("usuario_id", usuario?.empleado_id);
        formData.append("tipo_incidencia", incidenciaForm.tipo);
        formData.append("descripcion", incidenciaForm.descripcion);
        formData.append("fecha_incidencia", incidenciaForm.fecha_incidencia);

        incidenciaForm.evidencias.forEach((file) => {
            formData.append("archivos", file);
        });

        try {
            await crearIncidencia(formData);

            showSuccess("Incidencia registrada correctamente");
            setShowIncidenciaModal(false);
            setIncidenciaForm({
                tipo: "",
                descripcion: "",
                fecha_incidencia: "",
                evidencias: [],
            });
        } catch (error) {
            console.error(error);
            showError("Error al registrar la incidencia");
        }
    };

    return {
        showIncidenciaModal,
        setShowIncidenciaModal,
        incidenciaForm,
        handleIncidenciaChange,
        handleFileUpload,
        handleSubmitIncidencia,
    };
};
