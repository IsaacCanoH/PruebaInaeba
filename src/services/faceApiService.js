import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

export async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri(`${MODEL_URL}/tiny_face_detector`);
    await faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_URL}/face_landmark_68`);
    await faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_URL}/face_recognition`);
}

export function compareDescriptors(descriptor1, descriptor2, threshold = 0.5) {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    return distance < threshold;
}
