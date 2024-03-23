import { Box, TextField, TextFieldProps, Typography } from '@mui/material';

export default function FillInTheBlanks({
  textBeforeBlank,
  textAfterBlank,
  BlankInputProps,
}: FillInTheBlanksProps) {
  return (
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
  );
}

export interface FillInTheBlanksProps {
  textBeforeBlank: string;
  textAfterBlank: string;
  BlankInputProps: TextFieldProps;
}
