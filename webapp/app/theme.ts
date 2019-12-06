import createMuiTheme from '@material-ui/core/styles/createMuiTheme';


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
  },
}
});

export default theme;
