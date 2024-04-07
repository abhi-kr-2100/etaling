import { ReactNode } from 'react';
import { Box, TextField, TextFieldProps, Typography } from '@mui/material';

export default function FillInTheBlanks({
  componentsBeforeBlank,
  componentsAfterBlank,
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
        <Typography textAlign={'center'}>{componentsBeforeBlank}</Typography>
        <TextField {...BlankInputProps} />
        <Typography textAlign={'center'}>{componentsAfterBlank}</Typography>
      </Box>
      <Typography textAlign={'center'}>{hint}</Typography>
    </Box>
  );
}

export interface FillInTheBlanksProps {
  componentsBeforeBlank: ReactNode[];
  componentsAfterBlank: ReactNode[];
  hint?: string;
  BlankInputProps: TextFieldProps;
}
