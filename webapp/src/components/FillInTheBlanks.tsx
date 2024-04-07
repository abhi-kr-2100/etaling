import { ReactElement, cloneElement } from 'react';
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
        <Box>
          {componentsBeforeBlank.map((component, idx) =>
            cloneElement(component, {
              key: idx,
            }),
          )}
        </Box>
        <TextField {...BlankInputProps} />
        <Box>
          {componentsAfterBlank.map((component, idx) =>
            cloneElement(component, {
              key: idx,
            }),
          )}
        </Box>
      </Box>
      <Typography textAlign={'center'}>{hint}</Typography>
    </Box>
  );
}

export interface FillInTheBlanksProps {
  componentsBeforeBlank: ReactElement[];
  componentsAfterBlank: ReactElement[];
  hint?: string;
  BlankInputProps: TextFieldProps;
}
