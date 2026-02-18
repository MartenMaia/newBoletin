import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React from 'react';

export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
  onClose: () => void;
  ariaLabelledBy?: string;
}) {
  const { open, title, children, actions, onClose, ariaLabelledBy } = props;
  const titleId = ariaLabelledBy ?? 'modal-title';

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="sm">
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
}
