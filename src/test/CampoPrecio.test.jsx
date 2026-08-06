import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import CampoPrecio from '../components/shared/CampoPrecio';

// Wrapper controlado, igual a como se usa en Productos.jsx/Compras.jsx: el
// value/onChange trabajan con el número crudo (vía evento sintético), el
// componente se encarga solo del formato visual mientras se tipea.
function CampoControlado({ inicial = '', onChangeSpy }) {
  const [valor, setValor] = useState(inicial);
  return (
    <CampoPrecio
      value={valor}
      onChange={(e) => { setValor(e.target.value); onChangeSpy?.(e.target.value); }}
      inputProps={{ 'data-testid': 'campo' }}
    />
  );
}

describe('CampoPrecio', () => {
  it('formatea con separador de miles mientras se tipea, no solo al guardar', () => {
    const { getByTestId } = render(<CampoControlado />);
    const input = getByTestId('campo');

    fireEvent.change(input, { target: { value: '15000', selectionStart: 5 } });
    expect(input.value).toBe('15.000');

    fireEvent.change(input, { target: { value: '186000', selectionStart: 6 } });
    expect(input.value).toBe('186.000');

    fireEvent.change(input, { target: { value: '158000', selectionStart: 6 } });
    expect(input.value).toBe('158.000');
  });

  it('el onChange recibe el número crudo, sin puntos', () => {
    const onChangeSpy = vi.fn();
    const { getByTestId } = render(<CampoControlado onChangeSpy={onChangeSpy} />);
    const input = getByTestId('campo');

    fireEvent.change(input, { target: { value: '186000', selectionStart: 6 } });
    expect(onChangeSpy).toHaveBeenLastCalledWith('186000');
  });

  it('soporta decimales con coma (ej. costo por kg/litro)', () => {
    const onChangeSpy = vi.fn();
    const { getByTestId } = render(<CampoControlado onChangeSpy={onChangeSpy} />);
    const input = getByTestId('campo');

    fireEvent.change(input, { target: { value: '1500,5', selectionStart: 6 } });
    expect(input.value).toBe('1.500,5');
    expect(onChangeSpy).toHaveBeenLastCalledWith('1500.5');
  });

  it('borrar hasta vacío deja el campo vacío (no "0" ni "NaN")', () => {
    const onChangeSpy = vi.fn();
    const { getByTestId } = render(<CampoControlado inicial="15000" onChangeSpy={onChangeSpy} />);
    const input = getByTestId('campo');

    fireEvent.change(input, { target: { value: '', selectionStart: 0 } });
    expect(input.value).toBe('');
    expect(onChangeSpy).toHaveBeenLastCalledWith('');
  });

  it('mantiene el cursor después del dígito recién tipeado, no al final del campo', () => {
    // Caso típico que rompe los inputs con máscara mal hechos: escribir un
    // dígito en el MEDIO de un número ya formateado. Si el cursor no se
    // recalcula, salta al final y el usuario "no puede" seguir escribiendo
    // en el medio (cada tecla nueva se va al final).
    const { getByTestId } = render(<CampoControlado inicial="15000" />);
    const input = getByTestId('campo');
    // "15.000" -> insertar "9" después del "1" -> "195000" crudo -> "195.000"
    fireEvent.change(input, { target: { value: '195.000', selectionStart: 2 } });
    expect(input.value).toBe('195.000');
    // El cursor debía quedar tras el 2º dígito ("19|5.000"), no al final.
    expect(input.selectionStart).toBe(2);
  });

  it('sincroniza el valor mostrado cuando cambia desde afuera (reset de formulario)', () => {
    function Envoltorio() {
      const [valor, setValor] = useState('15000');
      return (
        <>
          <CampoPrecio value={valor} onChange={(e) => setValor(e.target.value)} inputProps={{ 'data-testid': 'campo' }} />
          <button onClick={() => setValor('')}>reset</button>
        </>
      );
    }
    const { getByTestId, getByText } = render(<Envoltorio />);
    expect(getByTestId('campo').value).toBe('15.000');
    fireEvent.click(getByText('reset'));
    expect(getByTestId('campo').value).toBe('');
  });
});
