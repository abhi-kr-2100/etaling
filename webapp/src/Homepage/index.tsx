import { Box } from '@mui/material';

import EtalingHeader from './EtalingHeader';
import SupportedLanguagesList from './SupportedLanguagesList';

import supportedLanguages from '../assets/language';

export default function Homepage() {
  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <EtalingHeader />
      <SupportedLanguagesList supportedLanguages={supportedLanguages} />
    </Box>
  );
}
