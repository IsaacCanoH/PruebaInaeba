const API_URL = 'https://backend-node-mjpn.onrender.com/api/fotosRostros';

export const guardarFotoRostro = async (usuario_id, imagen_base64, descriptor) => {
    try {
        const response = await fetch(`${API_URL}/guardar-foto-rostro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id,
                imagen_base64,
                descriptor
            })
        });

        if (!response.ok) {
            const errorText = await response.text(); // Evitar JSON.parse en error
            throw new Error(errorText || 'Error al guardar la foto de rostro');
        }

        return await response.json();
        
    } catch (error) {
        console.error('Error al guardar la foto de rostro:', error);
        throw error;
    }
};

export const obtenerFotoRostro = async (usuario_id) => {
    try {
        const response = await fetch(`${API_URL}/obtener-foto-rostro/${usuario_id}`);

        if (response.status === 404) {
            return null; // No hay rostro previo
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Error al obtener la foto de rostro');
        }

        return await response.json();

    } catch (error) {
        console.error('Error al obtener la foto de rostro:', error);
        throw error;
    }
};
