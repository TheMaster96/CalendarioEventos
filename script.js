document.addEventListener('DOMContentLoaded', function() {
    // ========== SELECTORES DEL DOM ==========
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const addEventBtn = document.getElementById('addEvent');
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    const saveBtn = document.getElementById('save-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const modalTitle = document.getElementById('modal-title');
    const notification = document.getElementById('notification');
    
    // Selectores de campos del formulario
    const eventTitle = document.getElementById('event-title');
    const eventDate = document.getElementById('event-date');
    const eventTime = document.getElementById('event-time');
    const eventDesc = document.getElementById('event-desc');
    const eventColor = document.getElementById('event-color');
    const colorValue = document.querySelector('.color-value');
    
    // ========== VARIABLES DE ESTADO ==========
    let currentDate = new Date();
    let events = []; // Esta será la fuente de datos después de cada carga de la API
    let selectedEvent = null;
    let selectedDay = null;

    // Instancia del servicio API
    const api = new ApiService();

    // ========== INICIALIZACIÓN ==========
    initializeCalendar();
    
    // Actualizar el valor del color mostrado
    eventColor.addEventListener('input', function() {
        colorValue.textContent = this.value;
    });

    // ========== FUNCIONES PRINCIPALES ==========
    
    async function initializeCalendar() {
        try {
            // Siempre intentar cargar desde la API
            const apiEvents = await api.getEvents(); //
            
            if (apiEvents && Array.isArray(apiEvents)) { //
                events = apiEvents; //
                showNotification('Calendario cargado correctamente desde la base de datos.', 'success');
            } else {
                // Si la API no devuelve un array válido, asumimos un problema
                events = []; // Limpiar eventos si la respuesta de la API no es válida
                showNotification('La API no devolvió datos válidos. Calendario vacío.', 'error');
            }
            renderCalendar();
        } catch (error) {
            console.error('Error al cargar eventos desde la API:', error); //
            events = []; // Limpiar eventos si hay un error de conexión con la API
            showNotification('Error al conectar con el servidor. No se pudieron cargar los eventos.', 'error'); //
            renderCalendar(); // Renderizar con el estado actual (probablemente vacío)
        }
    }
    
    /**
     * Renderiza el calendario completo para el mes y año actual
     */
    function renderCalendar() {
        // Limpiar el grid del calendario
        calendarGrid.innerHTML = '';
        
        // Configurar fecha al primer día del mes
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        // Obtener el último día del mes
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        // Días del mes anterior para completar la semana
        const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
        // Día de la semana en que comienza el mes (0 = Domingo)
        const firstDayIndex = firstDay.getDay();
        // Día de la semana en que termina el mes
        const lastDayIndex = lastDay.getDay();
        // Días del próximo mes para completar la cuadrícula
        const nextDays = 6 - lastDayIndex;
        
        // Actualizar el título del mes y año
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        currentMonthEl.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        
        // ===== GENERAR DÍAS DEL MES ANTERIOR =====
        for (let i = firstDayIndex; i > 0; i--) {
            const day = prevLastDay - i + 1;
            const dayElement = createDayElement(day, true);
            calendarGrid.appendChild(dayElement);
        }
        
        // ===== GENERAR DÍAS DEL MES ACTUAL =====
        const today = new Date();
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = createDayElement(i, false);
            
            // Marcar el día actual
            if (i === today.getDate() && 
                currentDate.getMonth() === today.getMonth() && 
                currentDate.getFullYear() === today.getFullYear()) {
                dayElement.querySelector('.day-number').classList.add('today');
            }
            
            // Verificar si hay eventos para este día
            const dayEvents = getEventsForDay(i);
            if (dayEvents.length > 0) {
                dayEvents.forEach(event => {
                    const eventElement = createEventElement(event);
                    dayElement.appendChild(eventElement);
                });
            }
            
            calendarGrid.appendChild(dayElement);
        }
        
        // ===== GENERAR DÍAS DEL MES SIGUIENTE =====
        for (let i = 1; i <= nextDays; i++) {
            const dayElement = createDayElement(i, true);
            calendarGrid.appendChild(dayElement);
        }
        
        // Añadir animación a los días
        animateDays();
    }
    
    /**
     * Crea un elemento HTML para un día del calendario
     */
    function createDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day animate-day';
        if (isOtherMonth) dayElement.classList.add('other-month');
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Evento click para seleccionar día
        dayElement.addEventListener('click', () => {
            if (!isOtherMonth) {
                selectedDay = day;
                openAddModal(day);
            }
        });
        
        return dayElement;
    }
    
    /**
     * Crea un elemento HTML para un evento
     */
    function createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event';
        eventElement.textContent = event.title;
        eventElement.style.borderLeftColor = event.color;
        eventElement.style.backgroundColor = `${event.color}20`;
        
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            showEventDetails(event);
        });
        
        return eventElement;
    }
    
    /**
     * Obtiene los eventos para un día específico
     * Se ha modificado para asegurar una comparación de fechas robusta.
     */
    function getEventsForDay(day) {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // 0-indexed

        return events.filter(event => {
            // Asegúrate de que event.date es una cadena de fecha válida para el constructor de Date
            // y que no es nula o indefinida.
            if (!event.date) {
                console.warn('Evento con fecha nula o indefinida:', event);
                return false;
            }
            
            const eventDateObj = new Date(event.date);

            // Verificar si la fecha del evento es válida
            if (isNaN(eventDateObj.getTime())) {
                console.error('Fecha de evento inválida:', event.date, event);
                return false;
            }

            // Comparar año, mes y día de forma estricta
            return (
                eventDateObj.getDate() === day &&
                eventDateObj.getMonth() === currentMonth &&
                eventDateObj.getFullYear() === currentYear
            );
        });
    }
    
    /**
     * Abre el modal para agregar un nuevo evento
     */
    function openAddModal(day) {
        selectedEvent = null;
        modalTitle.textContent = 'Nuevo Evento';
        deleteBtn.style.display = 'none';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const formattedMonth = month < 10 ? `0${month}` : month;
        const formattedDay = day < 10 ? `0${day}` : day;
        
        eventTitle.value = '';
        eventDate.value = `${year}-${formattedMonth}-${formattedDay}`;
        eventTime.value = '12:00';
        eventDesc.value = '';
        eventColor.value = '#3a86ff';
        colorValue.textContent = '#3a86ff';
        
        showModal();
    }
    
    /**
     * Muestra los detalles de un evento en el modal
     */
    function showEventDetails(event) {
        selectedEvent = event;
        modalTitle.textContent = 'Editar Evento';
        deleteBtn.style.display = 'flex';
        
        // La API de Python devuelve 'date' como 'YYYY-MM-DD' y 'time' como 'HH:MM:SS'
        // Nos aseguramos de que los valores se muestren correctamente en el formulario
        const eventDateStr = event.date;
        const eventTimeStr = event.time ? event.time.substring(0, 5) : '12:00'; // (HH:MM)

        eventTitle.value = event.title;
        eventDate.value = eventDateStr;
        eventTime.value = eventTimeStr;
        eventDesc.value = event.description || ''; // Coincide con 'description' de la API
        eventColor.value = event.color || '#3a86ff';
        colorValue.textContent = event.color || '#3a86ff';
        
        showModal();
    }
    
    /**
     * Guarda un evento (nuevo o editado)
     */
    async function saveEvent() {
        if (!eventTitle.value.trim()) {
            showNotification('Por favor ingresa un título para el evento', 'error');
            return;
        }
        
        const eventData = {
            title: eventTitle.value.trim(),
            date: eventDate.value, // YYYY-MM-DD
            time: eventTime.value, // HH:MM
            description: eventDesc.value.trim(),
            color: eventColor.value
        };

        if (selectedEvent) {
            eventData.id = selectedEvent.id; // Añadir ID si es una actualización
        }
        
        try {
            await api.saveEvent(eventData); // Llamada a la API
            
            showNotification('Evento guardado exitosamente en la base de datos', 'success');
            hideModal();
            triggerConfetti();
            await initializeCalendar(); // Recargar eventos desde la API para reflejar los cambios
        } catch (error) {
            console.error('Error al guardar el evento en la API:', error);
            showNotification('Error al guardar el evento. Intenta nuevamente.', 'error');
        }
    }
    
    /**
     * Elimina el evento seleccionado
     */
    async function deleteEvent() {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;
        
        try {
            await api.deleteEvent(selectedEvent.id); // Llamada a la API
            
            showNotification('Evento eliminado exitosamente de la base de datos', 'success');
            hideModal();
            await initializeCalendar(); // Recargar eventos desde la API
        } catch (error) {
            console.error('Error al eliminar el evento de la API:', error);
            showNotification('Error al eliminar el evento. Intenta nuevamente.', 'error');
        }
    }
    
    /**
     * Muestra el modal con animación
     */
    function showModal() {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    /**
     * Oculta el modal con animación
     */
    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    /**
     * Muestra una notificación
     */
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // ========== EFECTOS VISUALES ==========
    
    function triggerConfetti() {
        const jsConfetti = new JSConfetti();
        jsConfetti.addConfetti({
            confettiColors: [
                '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585',
                '#7209b7', '#4895ef', '#3f37c9', '#560bad'
            ],
            confettiNumber: 100,
            emojiSize: 30
        });
    }
    
    function animateDays() {
        const days = document.querySelectorAll('.day');
        days.forEach((day, index) => {
            day.style.animationDelay = `${index * 0.05}s`;
        });
    }
    
    // ========== EVENT LISTENERS ==========
    
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    addEventBtn.addEventListener('click', () => {
        openAddModal(new Date().getDate());
    });
    
    saveBtn.addEventListener('click', saveEvent);
    deleteBtn.addEventListener('click', deleteEvent);
    
    closeBtn.addEventListener('click', hideModal);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
});