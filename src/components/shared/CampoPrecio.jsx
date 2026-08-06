import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { TextField } from '@mui/material';

// Cuenta cuántos dígitos hay antes de una posición dada en un string.
function digitosAntesDe(str, pos) {
  let count = 0;
  for (let i = 0; i < pos && i < str.length; i++) {
    if (/\d/.test(str[i])) count++;
  }
  return count;
}

// Encuentra la posición en `str` que queda justo después de `n` dígitos —
// el inverso de digitosAntesDe(), para recolocar el cursor tras reformatear.
function posicionTrasNDigitos(str, n) {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (/\d/.test(str[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return str.length;
}

// El valor "crudo" (value prop / lo que devuelve aNumero) siempre usa punto
// decimal, formato número de JS — es lo que esperan form.costo, etc. Lo que
// el usuario ve y tipea en el input usa coma decimal (es-AR). Son dos
// formatos distintos a propósito: si se usara la misma función para las dos
// direcciones, resincronizar desde afuera con "1500.5" (punto) la
// interpretaba como "15005" (le comía el punto como si fuera de miles).

// value externo (número JS o string con punto: 1500.5) -> texto para mostrar
function formatearDesdeValor(valor) {
  if (valor === '' || valor == null) return '';
  const num = Number(valor);
  if (Number.isNaN(num)) return '';
  return Number.isInteger(num)
    ? num.toLocaleString('es-AR')
    : num.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

// texto que el usuario está tipeando (coma decimal) -> texto formateado
function formatearDesdeTexto(texto) {
  const str = String(texto ?? '').trim();
  if (!str) return '';
  const [enteroRaw, decimalRaw] = str.split(',');
  const enteroLimpio = enteroRaw.replace(/\D/g, '');
  const enteroFormateado = enteroLimpio ? Number(enteroLimpio).toLocaleString('es-AR') : '';
  if (decimalRaw === undefined) return enteroFormateado;
  const decimalLimpio = decimalRaw.replace(/\D/g, '').slice(0, 2);
  return `${enteroFormateado || '0'},${decimalLimpio}`;
}

// texto formateado (coma decimal) -> número crudo (punto decimal)
function aNumero(formateado) {
  if (!formateado) return '';
  const [enteroRaw, decimalRaw] = formateado.split(',');
  const enteroLimpio = enteroRaw.replace(/\D/g, '') || '0';
  if (decimalRaw === undefined) return Number(enteroLimpio);
  return Number(`${enteroLimpio}.${decimalRaw || '0'}`);
}

/**
 * Input de precio con separador de miles ("15.000") mientras se tipea, no
 * solo después de guardar — un <input type="number"> nativo no puede
 * mostrarlo (el navegador interpreta el punto como decimal, no como
 * separador de miles). Por fuera se usa igual que un TextField type="number":
 * onChange recibe un evento con target.value con el número crudo (sin
 * puntos), así los handlers existentes (setCosto, setMargen, etc.) no
 * necesitan tocarse.
 */
export default function CampoPrecio({ value, onChange, inputRef: inputRefExterno, ...props }) {
  const inputRef = useRef(null);
  const cursorPendiente = useRef(null);
  const [texto, setTexto] = useState(() => formatearDesdeValor(value));

  // Si el valor cambia desde afuera (reset de formulario, producto cargado
  // para editar) resincroniza el texto mostrado — pero no mientras el
  // usuario está tipeando en este mismo campo, para no pisarle el cursor.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setTexto(formatearDesdeValor(value));
    }
  }, [value]);

  useLayoutEffect(() => {
    if (cursorPendiente.current != null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPendiente.current, cursorPendiente.current);
      cursorPendiente.current = null;
    }
  }, [texto]);

  const handleChange = (e) => {
    const nuevoTexto = e.target.value;
    const cursorPrevio = e.target.selectionStart ?? nuevoTexto.length;
    const digitosPrevios = digitosAntesDe(nuevoTexto, cursorPrevio);
    const formateado = formatearDesdeTexto(nuevoTexto);
    cursorPendiente.current = posicionTrasNDigitos(formateado, digitosPrevios);
    setTexto(formateado);
    const numero = aNumero(formateado);
    onChange({ target: { value: numero === '' ? '' : String(numero) } });
  };

  return (
    <TextField
      {...props}
      inputRef={el => {
        inputRef.current = el;
        inputRefExterno?.(el);
      }}
      type="text"
      inputMode="decimal"
      value={texto}
      onChange={handleChange}
    />
  );
}
