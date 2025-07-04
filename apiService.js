/**
 * API Service para comunicación con el backend Python
 */
class ApiService {
    // La URL base debe coincidir con la raíz donde se exponen tus endpoints en api.py
    constructor(baseUrl = 'http://localhost:5000') {
        this.baseUrl = baseUrl;
    }

    /**
     * Obtener todos los eventos
     */
    async getEvents() {
        try {
            const response = await fetch(`${this.baseUrl}/events`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    /**
     * Guardar un evento (crear o actualizar)
     */
    async saveEvent(event) {
        try {
            const method = event.id ? 'PUT' : 'POST';
            const url = event.id ? `${this.baseUrl}/events/${event.id}` : `${this.baseUrl}/events`;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error saving event:', error);
            throw error;
        }
    }

    /**
     * Eliminar un evento
     */
    async deleteEvent(eventId) {
        try {
            const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }

    /**
     * Sincronizar eventos (para uso inicial)
     */
    async syncEvents(events) {
        try {
            const response = await fetch(`${this.baseUrl}/events/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(events)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error syncing events:', error);
            throw error;
        }
    }
}