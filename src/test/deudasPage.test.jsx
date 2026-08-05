import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Regresión: la página se rompía por completo (ReferenceError, pantalla en
// blanco) apenas había una deuda pendiente, porque la acción "Registrar pago"
// usaba <IconButton> sin importarlo de @mui/material. Este test renderiza la
// página con datos reales y confirma que no explota.
vi.mock('../services/deudasService', () => ({
  deudasService: {
    getAll: vi.fn(async () => ({
      deudas: [
        {
          id: 1, proveedor: 'Distribuidora Sur', fecha: '2026-06-01',
          total: 10000, pagado: 0, saldo: 10000, estado_deuda: 'pendiente', pagos: [],
        },
      ],
      totalDeuda: 10000,
    })),
  },
}));

describe('Deudas (página)', () => {
  it('renderiza una deuda pendiente y su botón de "Registrar pago" sin crashear', async () => {
    const { default: Deudas } = await import('../pages/Deudas/Deudas');
    render(<Deudas />);

    await waitFor(() => expect(screen.getByText('Distribuidora Sur')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Registrar pago' })).toBeInTheDocument();
  });
});
