import { useAuth0 } from '@auth0/auth0-react';
import { Button } from '@mui/material';

export default function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <Button variant="contained" onClick={loginWithRedirect}>
      Continue with Auth0
    </Button>
  );
}
