/**
 * CALENDARIO PREMIUM - SCRIPT PRINCIPAL
 * 
 * Este script maneja toda la lógica del calendario:
 * - Generación del calendario
 * - Manejo de eventos (CRUD)
 * - Persistencia en localStorage
 * - Efectos visuales y animaciones
 */

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
    
    // Selectores de campos del formulario
    const eventTitle = document.getElementById('event-title');
    const eventDate = document.getElementById('event-date');
    const eventTime = document.getElementById('event-time');
    const eventDesc = document.getElementById('event-desc');
    const eventColor = document.getElementById('event-color');
    const colorValue = document.querySelector('.color-value');
    
    // ========== VARIABLES DE ESTADO ==========
    let currentDate = new Date(); // Fecha actual
    let events = JSON.parse(localStorage.getItem('calendarEvents')) || []; // Eventos almacenados
    let selectedEvent = null; // Evento seleccionado para edición
    let selectedDay = null; // Día seleccionado para agregar evento

    // ========== INICIALIZACIÓN ==========
    renderCalendar(); // Generar el calendario al cargar la página
    
    // Actualizar el valor del color mostrado
    eventColor.addEventListener('input', function() {
        colorValue.textContent = this.value;
    });

    // ========== FUNCIONES PRINCIPALES ==========
    
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
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayElement = createDayElement(i, false);
            
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
     * @param {number} day - Número del día
     * @param {boolean} isOtherMonth - Si pertenece a otro mes
     * @returns {HTMLElement} - Elemento del día
     */
    function createDayElement(day, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
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
     * @param {Object} event - Objeto del evento
     * @returns {HTMLElement} - Elemento del evento
     */
    function createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event';
        eventElement.textContent = event.title;
        eventElement.style.borderLeftColor = event.color;
        eventElement.style.backgroundColor = `${event.color}20`; // Añadir transparencia
        
        // Mostrar detalles al hacer click
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            showEventDetails(event);
        });
        
        return eventElement;
    }
    
    /**
     * Obtiene los eventos para un día específico
     * @param {number} day - Día del mes
     * @returns {Array} - Array de eventos para ese día
     */
    function getEventsForDay(day) {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
            );
        });
    }
    
    /**
     * Abre el modal para agregar un nuevo evento
     * @param {number} day - Día seleccionado
     */
    function openAddModal(day) {
        // Configurar estado
        selectedEvent = null;
        modalTitle.textContent = 'Nuevo Evento';
        deleteBtn.style.display = 'none';
        
        // Formatear fecha
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const formattedMonth = month < 10 ? `0${month}` : month;
        const formattedDay = day < 10 ? `0${day}` : day;
        
        // Establecer valores predeterminados
        eventTitle.value = '';
        eventDate.value = `${year}-${formattedMonth}-${formattedDay}`;
        eventTime.value = '12:00';
        eventDesc.value = '';
        eventColor.value = '#3a86ff';
        colorValue.textContent = '#3a86ff';
        
        // Mostrar modal con animación
        modal.style.display = 'flex';
    }
    
    /**
     * Muestra los detalles de un evento en el modal
     * @param {Object} event - Evento a mostrar
     */
    function showEventDetails(event) {
        // Configurar estado
        selectedEvent = event;
        modalTitle.textContent = 'Editar Evento';
        deleteBtn.style.display = 'block';
        
        // Formatear fecha y hora
        const eventDateObj = new Date(event.date);
        const year = eventDateObj.getFullYear();
        const month = eventDateObj.getMonth() + 1;
        const day = eventDateObj.getDate();
        const hours = eventDateObj.getHours();
        const minutes = eventDateObj.getMinutes();
        
        const formattedMonth = month < 10 ? `0${month}` : month;
        const formattedDay = day < 10 ? `0${day}` : day;
        const formattedHours = hours < 10 ? `0${hours}` : hours;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        
        // Establecer valores en el formulario
        eventTitle.value = event.title;
        eventDate.value = `${year}-${formattedMonth}-${formattedDay}`;
        eventTime.value = `${formattedHours}:${formattedMinutes}`;
        eventDesc.value = event.desc || '';
        eventColor.value = event.color || '#3a86ff';
        colorValue.textContent = event.color || '#3a86ff';
        
        // Mostrar modal con animación
        modal.style.display = 'flex';
    }
    
    /**
     * Guarda un evento (nuevo o editado)
     */
    function saveEvent() {
        // Validar campos requeridos
        if (!eventTitle.value.trim()) {
            alert('Por favor ingresa un título para el evento');
            return;
        }
        
        // Crear objeto de fecha combinando date y time
        const dateTimeString = `${eventDate.value}T${eventTime.value}`;
        const eventDateObj = new Date(dateTimeString);
        
        // Crear objeto del evento
        const eventData = {
            id: selectedEvent ? selectedEvent.id : Date.now(),
            title: eventTitle.value.trim(),
            date: eventDateObj.toISOString(),
            desc: eventDesc.value.trim(),
            color: eventColor.value
        };
        
        if (selectedEvent) {
            // Actualizar evento existente
            const index = events.findIndex(e => e.id === selectedEvent.id);
            events[index] = eventData;
        } else {
            // Agregar nuevo evento
            events.push(eventData);
        }
        
        // Guardar en localStorage
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        
        // Efecto de confeti al guardar
        triggerConfetti();
        
        // Cerrar modal y actualizar calendario
        modal.style.display = 'none';
        renderCalendar();
    }
    
    /**
     * Elimina el evento seleccionado
     */
    function deleteEvent() {
        if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            // Filtrar el evento a eliminar
            events = events.filter(event => event.id !== selectedEvent.id);
            
            // Guardar en localStorage
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            
            // Cerrar modal y actualizar calendario
            modal.style.display = 'none';
            renderCalendar();
        }
    }
    
    // ========== EFECTOS VISUALES ==========
    
    /**
     * Dispara el efecto de confeti
     */
    function triggerConfetti() {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4361ee', '#3a0ca3', '#4cc9f0', '#f72585']
        });
    }
    
    /**
     * Añade animaciones a los días del calendario
     */
    function animateDays() {
        const days = document.querySelectorAll('.day:not(.other-month)');
        days.forEach((day, index) => {
            day.style.animationDelay = `${index * 0.05}s`;
            day.classList.add('animate__animated', 'animate__fadeIn');
        });
    }
    
    // ========== EVENT LISTENERS ==========
    
    // Navegación entre meses
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Botón para agregar evento
    addEventBtn.addEventListener('click', () => {
        openAddModal(new Date().getDate());
    });
    
    // Botón para guardar evento
    saveBtn.addEventListener('click', saveEvent);
    
    // Botón para eliminar evento
    deleteBtn.addEventListener('click', deleteEvent);
    
    // Cerrar modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});