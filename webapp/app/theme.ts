import createMuiTheme from '@material-ui/core/styles/createMuiTheme';

      secondary: {
const theme = (createMuiTheme)({
  palette: {
      primary: {
          main: '#FD9920',
      },
      secondary: {
          main: '#FBD146'
      }
  },
  typography: {
    fontFamily: [
      'Advent Pro',
    ].join(','),
  },
  overrides: {
  MuiTypography: {
    h1: {
      paddingTop: '32px',
      paddingBottom: '8px',
      textAlign: 'center'
    },
    h2: {
      paddingTop: '64px',
      paddingBottom: '32px',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    h3: {
      textAlign: 'center',
      paddingTop: '32px',
      paddingBottom: '32px'
    },
    h4: {
      paddingTop: '8px',
      paddingBottom: '16px',
      paddingLeft: '8px',
      paddingRight: '8px'
    },
    h5: {
      paddingTop: '32px',
      paddingBottom: '16px',
      textAlign: 'center',
    },
    subtitle1: {
      paddingTop: '8px',
      paddingBottom: '16px',
      textAlign: 'center',
    },
    body1: {
      paddingTop: '16px',
      textAlign: 'center',
    }
  },
}
});

export default theme;
