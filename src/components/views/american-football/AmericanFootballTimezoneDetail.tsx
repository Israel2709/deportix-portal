'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAmericanFootballTimezones, updateAmericanFootballTimezone } from '@/lib/american-football-api';
import {
  buildAmericanFootballTimezonePatchBody,
  validateAmericanFootballTimezoneForm,
  type AmericanFootballTimezoneFormValues,
} from '@/lib/american-football-forms/timezone-form';
import { ApiClientError } from '@/lib/api';
import { useToast } from '@/components/notifications/ToastProvider';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DataSection } from '@/components/states/States';
import { useRouter } from 'next/navigation';
import { americanFootballTimezoneDetailPath } from '@/lib/american-football-paths';
import {
  AmericanFootballDetailLayout,
  DetailEditableField,
  DetailField,
} from './AmericanFootballDetailLayout';
import { AmericanFootballDetailEditActions } from './AmericanFootballDetailEditActions';
import { useAmericanFootballDetailEdit } from './useAmericanFootballDetailEdit';

export function AmericanFootballTimezoneDetail({ timezone }: { timezone: string }) {
  const router = useRouter();
  const toast = useToast();
  const edit = useAmericanFootballDetailEdit();
  const [exists, setExists] = useState<boolean | null>(null);
  const [formValues, setFormValues] = useState<AmericanFootballTimezoneFormValues>({
    timezone,
    newTimezone: timezone,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const envelope = await getAmericanFootballTimezones();
      setExists(envelope.response.includes(timezone));
      setFormValues({ timezone, newTimezone: timezone });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el timezone');
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleStartEdit() {
    setFormValues({ timezone, newTimezone: timezone });
    edit.startEdit();
  }

  async function handleConfirmSave() {
    const validation = validateAmericanFootballTimezoneForm(formValues, 'edit');
    if (validation) {
      toast.error('Validación', validation);
      edit.closeConfirm();
      return;
    }

    edit.setSubmitting(true);
    try {
      await updateAmericanFootballTimezone(buildAmericanFootballTimezonePatchBody(formValues));
      toast.success('Timezone actualizado');
      edit.finishEdit();
      if (formValues.newTimezone.trim() !== timezone) {
        router.replace(americanFootballTimezoneDetailPath(formValues.newTimezone.trim()));
      } else {
        void load();
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'No se pudo guardar el timezone.';
      toast.error('Error en la solicitud', message);
      edit.closeConfirm();
    } finally {
      edit.setSubmitting(false);
    }
  }

  return (
    <AmericanFootballDetailLayout
      title={timezone}
      subtitle="Zona horaria IANA"
      actions={
        exists ? (
          <AmericanFootballDetailEditActions
            editing={edit.editing}
            submitting={edit.submitting}
            onEdit={handleStartEdit}
            onCancel={edit.cancelEdit}
            onSave={edit.requestSave}
          />
        ) : undefined
      }
    >
      <DataSection
        loading={loading}
        error={error}
        isEmpty={!loading && !error && exists === false}
        emptyTitle="Timezone no encontrado"
        emptyHint="Verifica que la zona horaria esté registrada en el BFF."
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Identificador" value={timezone} />
          <DetailField label="Formato" value="IANA Time Zone Database" />
          {edit.editing && (
            <DetailEditableField
              label="Nuevo identificador"
              value={timezone}
              editing={edit.editing}
              editValue={formValues.newTimezone}
              onChange={(value) => setFormValues((current) => ({ ...current, newTimezone: value }))}
            />
          )}
        </dl>
      </DataSection>

      <ConfirmModal
        open={edit.confirmOpen}
        title="Guardar cambios"
        message={`¿Confirmas la actualización del timezone ${timezone}?`}
        confirmLabel="Guardar cambios"
        onConfirm={() => void handleConfirmSave()}
        onCancel={edit.closeConfirm}
        submitting={edit.submitting}
      />
    </AmericanFootballDetailLayout>
  );
}
