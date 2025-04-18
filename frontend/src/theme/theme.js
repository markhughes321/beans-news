import { createTheme, adaptV4Theme } from '@mui/material/styles';

const lightPalette = {
  primary: {
    main: '#2A5C5A', // Muted teal for primary actions
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#D16F5A', // Muted coral for secondary actions
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F9F5F0', // Off-white for a warm, clean backdrop
    paper: '#FFFFFF',
  },
  text: {
    primary: '#2D2D2D', // Dark grey for readability
    secondary: '#666666', // Softer grey for secondary text
    disabled: '#A0A0A0',
  },
  error: {
    main: '#C44536',
  },
  warning: {
    main: '#F4A261',
  },
  info: {
    main: '#2A5C5A',
  },
  success: {
    main: '#5C8D89',
  },
};

const darkPalette = {
  primary: {
    main: '#4A8A87',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#E68A76',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#2D2D2D',
    paper: '#3A3A3A',
  },
  text: {
    primary: '#E8E8E8',
    secondary: '#B0B0B0',
    disabled: '#787878',
  },
  error: {
    main: '#D16F5A',
  },
  warning: {
    main: '#F4A261',
  },
  info: {
    main: '#4A8A87',
  },
  success: {
    main: '#5C8D89',
  },
};

const theme = createTheme(adaptV4Theme({
  palette: {
    mode: 'light', // Default to light mode
    ...lightPalette,
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", "Arial", sans-serif',
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      color: lightPalette.text.primary,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: lightPalette.text.primary,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      color: lightPalette.text.primary,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: lightPalette.text.secondary,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: {
      fontSize: '0.75rem',
      color: lightPalette.text.secondary,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: lightPalette.background.paper,
          color: lightPalette.text.primary,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          transition: 'all 0.3s ease',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
            backgroundColor: lightPalette.primary.main,
            color: lightPalette.primary.contrastText,
          },
        },
        contained: {
          fontSize: '0.9rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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
          backgroundColor: '#F9F5F0',
          fontWeight: 600,
          color: lightPalette.text.primary,
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
  spacing: 8,
}));

export default theme;