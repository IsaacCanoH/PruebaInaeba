import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Modal, Spinner } from 'react-bootstrap';
import * as faceapi from 'face-api.js';
import { compareDescriptors } from '../../services/faceApiService';
import { guardarFotoRostro, obtenerFotoRostro } from '../../services/dashboard/fotoRostroService';
import { useToast } from '../../context/ToastContext';
import './FaceRecognitionModal.css';

const FaceRecognitionModal = ({ show, onSuccess, onFailure, usuario, onClose }) => {
  const webcamRef = useRef(null);
  const intervaloRef = useRef(null);
  const procesandoRef = useRef(false);
  const yaFinalizadoRef = useRef(false);

  const { showError } = useToast();

  const [feedback, setFeedback] = useState('Cargando modelos...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) iniciar();
    return limpiar;
  }, [show]);

  const limpiar = () => {
    clearInterval(intervaloRef.current);
    procesandoRef.current = false;
    yaFinalizadoRef.current = false;
    setFeedback('Cargando modelos...');
    setLoading(true);
  };

  const iniciar = () => {
    setFeedback('Buscando rostro...');
    setLoading(false);
    iniciarDeteccion();
  };


  const iniciarDeteccion = () => {
    const video = webcamRef.current.video;
    let intentos = 0;
    const maxIntentos = 20;

    intervaloRef.current = setInterval(async () => {
      if (!video || procesandoRef.current || yaFinalizadoRef.current) return;

      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

      intentos++;

      if (!detection) {
        if (intentos % 5 === 0) setFeedback('No se detecta tu rostro');
        if (intentos >= maxIntentos) finalizarProceso(false);
        return;
      }

      const { box } = detection;
      const sizeRatio = box.width / video.videoWidth;
      const centerX = box.x + box.width / 2;
      const deviation = Math.abs(centerX - video.videoWidth / 2);

      if (sizeRatio < 0.2) {
        if (intentos % 5 === 0) setFeedback('Acércate un poco más');
      } else if (sizeRatio > 0.6) {
        if (intentos % 5 === 0) setFeedback('Aléjate un poco');
      } else if (deviation > 50) {
        if (intentos % 5 === 0) setFeedback('Centra tu rostro');
      } else {
        finalizarProceso(true);
      }
    }, 500);
  };

  const finalizarProceso = (exito) => {
    if (yaFinalizadoRef.current) return; // Evita múltiples ejecuciones
    yaFinalizadoRef.current = true;

    clearInterval(intervaloRef.current);

    if (exito) {
      capturarYComparar();
    } else {
      showError('No se pudo capturar el rostro');
      onFailure?.();
    }
  };

  const capturarYComparar = async () => {
    procesandoRef.current = true;

    try {
      setFeedback('Procesando rostro...');

      const video = webcamRef.current.video;
      const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) throw new Error('No se detectó el rostro.');

      const imagen_base64 = capturarImagen(video);
      const descriptorArray = Array.from(detection.descriptor);

      const respuesta = await obtenerFotoRostro(usuario.empleado_id);

      if (respuesta?.descriptor) {
        const referencia = new Float32Array(Object.values(respuesta.descriptor));
        const esIgual = compareDescriptors(detection.descriptor, referencia);

        if (esIgual) {
          setFeedback('Rostro verificado correctamente');
          onSuccess?.();
        } else {
          showError('Rostro no coincide');
          onFailure?.();
        }
      } else {
        await guardarFotoRostro(usuario.empleado_id, imagen_base64, descriptorArray);
        setFeedback('Rostro registrado correctamente');
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      showError('Error al procesar rostro');
      onFailure?.();
    }
  };

  const capturarImagen = (video) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Reconocimiento Facial</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {loading && <Spinner animation="border" />}
        <div className="feedback-container">
          <h5>Instrucciones</h5>
          <p>{feedback}</p>
        </div>
        <div className="face-recognition-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'user' }}
            className="face-webcam"
          />
          <div className="camera-overlay"></div>
        </div>
        <p className="face-instructions">Coloca tu rostro al centro del círculo y mantén una distancia adecuada.</p>
      </Modal.Body>
    </Modal>
  );
};

export default FaceRecognitionModal;
