import { Box, TextField, TextFieldProps, Typography } from '@mui/material';

export default function FillInTheBlanks({
  textBeforeBlank,
  textAfterBlank,
  hint,
  BlankInputProps,
}: FillInTheBlanksProps) {
  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      sx={{
        gap: 1,
      }}
      alignItems={'center'}
    >
      <Box
        display={'flex'}
        alignItems={'center'}
        sx={{
          gap: 1.5,
        }}
      >
        <Typography>{textBeforeBlank}</Typography>
        <TextField {...BlankInputProps} />
        <Typography>{textAfterBlank}</Typography>
      </Box>
      <Typography>{hint}</Typography>
    </Box>
  );
}

export interface FillInTheBlanksProps {
  textBeforeBlank: string;
  textAfterBlank: string;
  hint?: string;
  BlankInputProps: TextFieldProps;
}
