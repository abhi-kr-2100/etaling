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
      paddingInline={15}
    >
      <Box
        display={'flex'}
        flexDirection={'column'}
        alignItems={'center'}
        sx={{
          gap: 1.5,
        }}
      >
        <Typography textAlign={'center'}>{textBeforeBlank}</Typography>
        <TextField {...BlankInputProps} />
        <Typography textAlign={'center'}>{textAfterBlank}</Typography>
      </Box>
      <Typography textAlign={'center'}>{hint}</Typography>
    </Box>
  );
}

export interface FillInTheBlanksProps {
  textBeforeBlank: string;
  textAfterBlank: string;
  hint?: string;
  BlankInputProps: TextFieldProps;
}
