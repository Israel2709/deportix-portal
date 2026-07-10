'use client';

import { useState } from 'react';

export function useAmericanFootballDetailEdit() {
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return {
    editing,
    confirmOpen,
    submitting,
    setSubmitting,
    startEdit: () => setEditing(true),
    cancelEdit: () => {
      setEditing(false);
      setConfirmOpen(false);
    },
    requestSave: () => setConfirmOpen(true),
    closeConfirm: () => setConfirmOpen(false),
    finishEdit: () => {
      setEditing(false);
      setConfirmOpen(false);
    },
  };
}
