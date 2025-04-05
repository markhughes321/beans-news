import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e88e5', // Blue for primary actions
    },
    secondary: {
      main: '#43a047', // Green for secondary elements
    },
    background: {
      default: '#f9f9f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#333',
      secondary: '#666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontSize: '1.2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.9rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'uppercase',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  },
});

export default theme;