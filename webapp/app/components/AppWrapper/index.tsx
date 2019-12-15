import React, { useState } from 'react';
import { List, Container, Button, Menu, Avatar, MenuItem, ListItem, Typography } from '@material-ui/core';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Blockies from 'react-blockies';
import Toolbar from '@material-ui/core/Toolbar';
import { RouteComponentProps, Link } from 'react-router-dom';
import ReactSVG from 'react-svg';
import { forwardTo } from 'utils/history';

const spacingFromProfile = 20;
const footerHeight = 300;

const styles = ({ spacing, zIndex, mixins }: Theme) => createStyles({
  appBar: {
    zIndex: zIndex.drawer + 1,
  },
  appBarLogo: {
    paddingLeft: spacing(3),
    width: '175px',
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
    paddingBottom: spacing(2),
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
  },
  navItem: {
    minWidth: 100,
  }
});

interface OwnProps extends WithStyles<typeof styles> {
  children: React.ReactNode;
  isMetamaskInstalled: boolean,
  isLoggedIn: boolean,
  ethAddress?: string,
  authorizedNetwork: boolean,
  isAdmin: boolean,
  daiBalance?: number,
  connect(): void
}


type Props = OwnProps & RouteComponentProps;

const AppWrapper: React.FunctionComponent<Props> = ({
  classes,
  children,
  isMetamaskInstalled,
  isLoggedIn,
  isAdmin,
  ethAddress,
  connect
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<EventTarget | null>(null);
  return (
    <div className={classes.body}>
      <AppBar position="fixed" className={classes.appBar} >
        <Container maxWidth='lg'>
          <Toolbar disableGutters={true} className={classes.toolbar}>
            <Link className={classes.appBarLogo} to="/">
              <ReactSVG src="/nobuntu-logo.svg" />
            </Link>
            <div className={classes.navAccount}>
              <List className={classes.navList}>
                {isLoggedIn &&
                  <>
                    <ListItem button selected={location.pathname === '/'} onClick={() => forwardTo('/')} className={classes.navItem}>
                      <Typography className="navButton">Dashboard</Typography>
                    </ListItem>
                    <ListItem button selected={location.pathname === '/portfolio'} onClick={() => forwardTo('/portfolio')} className={classes.navItem}>
                      <Typography className="navButton">Portfolio</Typography>
                    </ListItem>
                  </>}
                {isLoggedIn && isAdmin &&
                  <ListItem button selected={location.pathname === '/admin/pools'} onClick={() => forwardTo('/admin/pools')} className={classes.navItem}>
                    <Typography className="navButton">Pools</Typography>
                  </ListItem>}
              </List>
              {!isMetamaskInstalled ? (
                <div className={classes.connectButton}>
                  <Button onClick={() => alert('install metamask')}>Install Metamask</Button>
                </div>
              ) :
                !ethAddress ? (
                  <div className={classes.connectButton}>
                    <Button onClick={() => connect()}>Connect with Metamask</Button>
                  </div>
                ) : (
                    <>
                      <Avatar onClick={(e) => setAnchorEl(e.currentTarget)} className={classes.avatar}>
                        <Blockies seed={ethAddress || '0x'} size={10} />
                      </Avatar>
                      <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl as Element}
                        getContentAnchorEl={null}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => alert('log out')}>Log Out</MenuItem>
                      </Menu>
                    </>
                  )}
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
