from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql.cursors
import os
import uuid

app = Flask(__name__)
CORS(app)

# --- Configuración de la Base de Datos MariaDB ---
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'calendar_db')

def get_db_connection():
    """Establece y devuelve una conexión a la base de datos."""
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor 
        )
        return connection
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

# --- Endpoints de la API ---

@app.route('/')
def home():
    """Endpoint de prueba para verificar que el backend está funcionando."""
    return "¡Bienvenido a la API del Calendario!"

@app.route('/events', methods=['GET'])
def get_events():
    """Obtiene todos los eventos de la base de datos."""
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    try:
        with connection.cursor() as cursor:
            sql = "SELECT id, title, date, time, description, color FROM events ORDER BY date, time"
            cursor.execute(sql)
            events = cursor.fetchall()
            return jsonify(events), 200
    except Exception as e:
        print(f"Error al obtener eventos: {e}")
        return jsonify({"error": "Error interno del servidor al obtener eventos"}), 500
    finally:
        connection.close()

@app.route('/events', methods=['POST'])
def add_event():
    """Añade un nuevo evento a la base de datos."""
    new_event = request.json
    if not new_event or not all(k in new_event for k in ['title', 'date']):
        return jsonify({"error": "Datos de evento incompletos (requiere título y fecha)"}), 400

    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    try:
        with connection.cursor() as cursor:
            event_id = str(uuid.uuid4()) 
            sql = """
            INSERT INTO events (id, title, date, time, description, color)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                event_id,
                new_event['title'],
                new_event['date'],
                new_event.get('time'),
                new_event.get('description'),
                new_event.get('color', '#3a86ff')
            ))
        connection.commit()
        return jsonify({"message": "Evento añadido exitosamente", "id": event_id}), 201
    except Exception as e:
        print(f"Error al añadir evento: {e}")
        return jsonify({"error": "Error interno del servidor al añadir evento"}), 500
    finally:
        connection.close()

@app.route('/events/<string:event_id>', methods=['PUT'])
def update_event(event_id):
    """Actualiza un evento existente en la base de datos."""
    updated_data = request.json
    if not updated_data:
        return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400

    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    try:
        with connection.cursor() as cursor:
            set_clauses = []
            values = []
            
            if 'title' in updated_data:
                set_clauses.append("title = %s")
                values.append(updated_data['title'])
            if 'date' in updated_data:
                set_clauses.append("date = %s")
                values.append(updated_data['date'])
            if 'time' in updated_data:
                set_clauses.append("time = %s")
                values.append(updated_data['time'])
            if 'description' in updated_data:
                set_clauses.append("description = %s")
                values.append(updated_data['description'])
            if 'color' in updated_data:
                set_clauses.append("color = %s")
                values.append(updated_data['color'])
            
            if not set_clauses:
                return jsonify({"error": "No hay campos válidos para actualizar"}), 400

            sql = f"UPDATE events SET {', '.join(set_clauses)} WHERE id = %s"
            values.append(event_id)
            
            cursor.execute(sql, tuple(values))
        connection.commit()
        if cursor.rowcount == 0:
            return jsonify({"message": "Evento no encontrado"}), 404
        return jsonify({"message": "Evento actualizado exitosamente"}), 200
    except Exception as e:
        print(f"Error al actualizar evento: {e}")
        return jsonify({"error": "Error interno del servidor al actualizar evento"}), 500
    finally:
        connection.close()

@app.route('/events/<string:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Elimina un evento de la base de datos."""
    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    try:
        with connection.cursor() as cursor:
            sql = "DELETE FROM events WHERE id = %s"
            cursor.execute(sql, (event_id,))
        connection.commit()
        if cursor.rowcount == 0:
            return jsonify({"message": "Evento no encontrado"}), 404
        return jsonify({"message": "Evento eliminado exitosamente"}), 200
    except Exception as e:
        print(f"Error al eliminar evento: {e}")
        return jsonify({"error": "Error interno del servidor al eliminar evento"}), 500
    finally:
        connection.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
