import React from 'react';
import { List, Container } from '@material-ui/core';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import { RouteComponentProps } from 'react-router-dom';


const spacingFromProfile = 20;
const footerHeight = 300;

const styles = ({ spacing, zIndex, mixins }: Theme) => createStyles({
  appBar: {
    zIndex: zIndex.drawer + 1,
  },

  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignContent: 'center',
    ...mixins.toolbar,
  },
  body: {
    height: "100%",
    margin: "0",
  },
  content: {
    paddingTop: spacing(8),
    paddingLeft: spacing(2),
    paddingRight: spacing(2),
    position: "relative",
    minHeight: `calc(100vh - ${footerHeight}px)`,
  },
  navAccount: {
    display: 'flex',
    height: spacing(8),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignContent: 'center',
    '& > *': {
      display: 'inline-block',
      alignSelf: 'center',
    }
  },
  navList: {
    display: 'flex',
    height: "100%",
    flexDirection: 'row',
    margin: `0 ${spacingFromProfile}px 0 0`,
    padding: 0,
    '& > *': {
      margin: `0`,
      textAlign: 'center',
      display: "inline-flex",
      justifyContent: "center",
    },
  },
  avatar: {
    marginRight: spacing(3),
  },
  connectButton: {
    marginRight: spacing(3),
    "& > *": {
      margin: 0
    }
  },
  navButton: {
    fontFamily: "Montserrat",
    fontWeight: "bold",
    fontSize: "14px",
  },
  background: {
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    maxHeight: `calc(100vh - ${footerHeight}px)`,
    zIndex: -1,
    "& img": {
      width: "100%",
      maxHeight: `calc(100vh - ${footerHeight}px)`,
    },
    "& ~ *": {
      zIndex: 0
    }
  },
});

interface OwnProps extends WithStyles<typeof styles> {
  children: React.ReactNode;
}


type Props = OwnProps & RouteComponentProps;

const AppWrapper: React.FunctionComponent<Props> = ({
  classes,
  children,
}: Props) => {
  return (
    <div className={classes.body}>
      <AppBar position="fixed" className={classes.appBar} >
        <Container maxWidth='lg'>
          <Toolbar disableGutters={true} className={classes.toolbar}>
            <div className={classes.navAccount}>
              <List className={classes.navList}>

              </List>

            </div>
          </Toolbar>
        </Container>
      </AppBar>
      <main className={classes.content}>
        {children}
      </main>
    </div>
  );
}

export default withStyles(styles, { withTheme: true })(AppWrapper);
