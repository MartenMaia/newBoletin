import { FormControl, FormHelperText, InputLabel, OutlinedInput } from '@mui/material';

export function FormField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  autoComplete?: string;
}) {
  const { id, label, value, onChange, type, required, error, autoComplete } = props;
  return (
    <FormControl fullWidth required={required} error={Boolean(error)}>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <OutlinedInput
        id={id}
        label={label}
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputProps={{ 'aria-label': label }}
      />
      {error ? <FormHelperText>{error}</FormHelperText> : null}
    </FormControl>
  );
}
