// File: ./frontend/src/theme/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Vibrant blue for primary actions
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#388e3c', // Fresh green for secondary actions
      light: '#66bb6a',
      dark: '#2e7d32',
      contrastText: '#fff',
    },
    background: {
      default: '#fafafa', // Light grey for a clean backdrop
      paper: '#ffffff',
    },
    text: {
      primary: '#212121', // Darker for readability
      secondary: '#757575',
      disabled: '#bdbdbd',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#f57c00',
    },
    info: {
      main: '#0288d1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', // Modern font
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none', // No uppercase for a modern feel
    },
    caption: {
      fontSize: '0.75rem',
      color: '#757575',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          color: '#212121',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 8px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f5f5f5',
          fontWeight: 600,
          color: '#424242',
        },
        body: {
          padding: '12px',
          borderBottom: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
  },
  spacing: 8, // Consistent spacing unit
});

export default theme;