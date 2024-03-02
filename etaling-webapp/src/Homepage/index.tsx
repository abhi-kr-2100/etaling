import { Box } from '@mui/material';

import EtalingHeader from './EtalingHeader';
import SupportedLanguagesCarousel from './SupportedLanguagesCarousel';

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
      <SupportedLanguagesCarousel supportedLanguages={supportedLanguages} />
    </Box>
  );
}
