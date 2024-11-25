import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';

const defaultTheme = createTheme(
  {
    typography: {
      fontFamily: `'Poppins', sans-serif`,
      allVariants: {
        color: '#444',
        textDecoration: 'none',
      },
      h6: {
        fontWeight: 'normal',
      },
    },
    palette: {
      primary: {
        main: '#000',
      },
      secondary: {
        main: '#5d9f38',
      },
      neutral: {
        dark: '#2e2e2e',
        main: '#64748B',
        contrastText: '#fff',
      },
      accent: {
        main: '#d7df23',
      },
      beige: {
        main: 'rgba(228, 111, 42, 0.05)',
        contrastText: '#000',
      },
    },
    shadows: [
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
    ],
    dShadows: [
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
      '0px 0px 8px #0000001A',
    ],
    components: {
      MuiIconButton: {
        defaultProps: {
          disableRipple: true,
          disableFocusRipple: true,
        },
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: 'transparent!important',
            },
            padding: 0,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
          disableRipple: true,
          disableFocusRipple: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
          startIcon: {
            width: 18,
          },
        },
        variants: [
          {
            props: {
              variant: 'text',
            },
            defaultProps: {
              disableElevation: true,
              disableRipple: true,
              disableFocusRipple: true,
            },
            style: {
              '&:hover': {
                backgroundColor: 'transparent!important',
              },
              padding: 0,
            },
          },
          {
            props: {
              variant: 'contained',
            },
            style: {
              borderRadius: '50px',
            },
          },
          {
            props: {
              variant: 'outlined',
            },
            style: {
              borderRadius: '50px',
            },
          },
        ],
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            boxShadow: '0px 0px 16px #0000001A!important',
            // talvez seja o caso de reportar o override que não ta funcionando sem important
            borderRadius: '8px!important',
          },
        },
      },
    },
  },
  ptBR,
);

export default defaultTheme;
