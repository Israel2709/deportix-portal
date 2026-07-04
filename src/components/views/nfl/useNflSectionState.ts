'use client';

import { useCallback, useState } from 'react';
import { ApiClientError } from '@/lib/api';
import { useToast } from '@/components/notifications/ToastProvider';
import type { NflFormMode } from '@/lib/nfl-forms/shared';

export function useNflSectionState<T extends object>(emptyForm: T) {
  const toast = useToast();
  const [mode, setMode] = useState<NflFormMode>('create');
  const [values, setValues] = useState<T>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  }, []);

  const reloadList = useCallback(() => setListKey((k) => k + 1), []);

  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      const message = err instanceof ApiClientError ? err.message : fallback;
      toast.error('Error en la solicitud', message);
    },
    [toast],
  );

  const handleSuccess = useCallback(
    (title: string, results?: number) => {
      toast.success(
        title,
        results != null ? `results: ${results}` : undefined,
      );
      reloadList();
    },
    [toast, reloadList],
  );

  return {
    mode,
    setMode,
    values,
    setValues,
    updateField,
    submitting,
    setSubmitting,
    confirmDelete,
    setConfirmDelete,
    listKey,
    reloadList,
    handleError,
    handleSuccess,
    toast,
  };
}

export function submitLabelForMode(mode: NflFormMode): string {
  switch (mode) {
    case 'create':
      return 'Crear';
    case 'edit':
      return 'Guardar cambios';
    case 'delete':
      return 'Eliminar';
    case 'query':
      return 'Consultar';
  }
}
