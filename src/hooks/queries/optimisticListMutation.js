import { useMutation, useQueryClient } from '@tanstack/react-query';

// Factoriza el patrón repetido en los hooks de queries: cancelar un refetch en
// curso, guardar una copia de la lista, aplicar el cambio en el cliente, revertir
// si la mutación falla, e invalidar (por prefijo) cuando termina.
//
// listsKey: key "amplia" (prefijo) usada para cancelQueries/invalidateQueries.
// listKey:  key exacta de la query que la pantalla realmente lee (debe coincidir
//           con los params usados en el useQuery correspondiente).
// updater:  (old, variables) => nuevo array de la lista.
// extraInvalidateKeys: prefijos adicionales a invalidar al terminar — para
//           mutaciones que además cambian datos de OTRA lista (ej: un
//           movimiento de tipo "ajuste" cambia el stock, así que también hay
//           que invalidar la lista de Productos, no solo la de Movimientos).
export function useOptimisticListMutation({ listsKey, listKey, mutationFn, updater, extraInvalidateKeys = [] }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: listsKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(listKey, (old) => updater(old, variables));
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listsKey });
      extraInvalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
  });
}
