import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
let modelosCargados = false;

export async function loadModels() {
    if (modelosCargados) return; // Evita recarga múltiple

    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`),
        faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}/face_recognition`)
    ]);

    modelosCargados = true;
}

export function compareDescriptors(descriptor1, descriptor2, threshold = 0.5) {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return distance < threshold;
}
