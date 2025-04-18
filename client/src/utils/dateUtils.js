import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/es';

// Cargar plugins
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.extend(localizedFormat);

// Configurar localización
dayjs.locale('es');

// Personalizar etiquetas de tiempo relativo
dayjs.updateLocale('es', {
  relativeTime: {
    future: 'en %s',
    past: 'hace %s',
    s: 'unos segundos',
    m: 'un minuto',
    mm: '%d minutos',
    h: 'una hora',
    hh: '%d horas',
    d: 'un día',
    dd: '%d días',
    M: 'un mes',
    MM: '%d meses',
    y: 'un año',
    yy: '%d años'
  }
});

/**
 * Formatea una fecha en formato relativo (ej: "hace 5 minutos")
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha en formato relativo
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  return dayjs(date).fromNow();
};

/**
 * Formatea una fecha en formato completo (ej: "23 abril 2025 15:30")
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatFullDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('D MMMM YYYY HH:mm');
};

/**
 * Formatea una fecha en formato corto (ej: "23/04/2025")
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha en formato corto
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  return dayjs(date).format('DD/MM/YYYY');
};

/**
 * Formatea una hora (ej: "15:30")
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Hora formateada
 */
export const formatTime = (date) => {
  if (!date) return '';
  return dayjs(date).format('HH:mm');
};

/**
 * Comprueba si una fecha es hoy
 * @param {string|Date} date - Fecha a comprobar
 * @returns {boolean} true si la fecha es hoy
 */
export const isToday = (date) => {
  if (!date) return false;
  return dayjs(date).isSame(dayjs(), 'day');
};

/**
 * Comprueba si una fecha es ayer
 * @param {string|Date} date - Fecha a comprobar
 * @returns {boolean} true si la fecha es ayer
 */
export const isYesterday = (date) => {
  if (!date) return false;
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
};

/**
 * Formatea fecha inteligentemente según contexto
 * - Si es hoy, muestra solo la hora
 * - Si es ayer, muestra "Ayer"
 * - Si es esta semana, muestra el día de la semana
 * - Si es más antiguo, muestra la fecha completa
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada según contexto
 */
export const formatSmartDate = (date) => {
  if (!date) return '';
  
  const dateObj = dayjs(date);
  
  if (isToday(date)) {
    return dateObj.format('HH:mm');
  }
  
  if (isYesterday(date)) {
    return `Ayer ${dateObj.format('HH:mm')}`;
  }
  
  if (dateObj.isAfter(dayjs().subtract(7, 'day'))) {
    return dateObj.format('dddd HH:mm');
  }
  
  return dateObj.format('D MMM YYYY');
};

export default {
  formatRelativeTime,
  formatFullDate,
  formatShortDate,
  formatTime,
  isToday,
  isYesterday,
  formatSmartDate
}; 