/**
 *
 * HomeHeader
 *
 */

import React, { Fragment } from 'react';
import { Theme, createStyles, withStyles, WithStyles, Typography } from '@material-ui/core';

const styles = ({ palette }: Theme) =>
  createStyles({
    pageHeader: {
      justifyContent: 'space-between',
    },
    tableHeader: {
      backgroundColor: 'lightgrey',
      borderTop: `${palette.primary.main} 2px solid`,
    },
    mainHeading: {
      paddingTop: '64px',
      paddingBottom: '32px',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    runningTotal: {
      paddingTop: '32px',
      paddingBottom: '8px',
      textAlign: 'center'
    },
    subtitle1: {
      paddingTop: '8px',
      paddingBottom: '16px',
      textAlign: 'center',
    },
    description: {
      paddingTop: '16px',
      textAlign: 'center',
    },
    slogan: {
      paddingTop: '32px',
      paddingBottom: '16px',
      textAlign: 'center',
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  allPoolsBalance: number
}

const HomeHeader: React.FunctionComponent<OwnProps> = ({ allPoolsBalance, classes }: OwnProps) => (
    <>
      <Fragment>
        <Typography variant="h2" className={classes.mainHeading}>
          WELCOME TO TIME DEPOSIT
        </Typography>
        <br></br>
        <Typography variant="h1" className={classes.runningTotal}>
          {`$ ${allPoolsBalance.toLocaleString(undefined, {maximumFractionDigits:2})}`}
        </Typography>
        <Typography variant="subtitle1" className={classes.subtitle1}>
          Currently contributed to pools
        </Typography>
        <Typography variant="h5" className={classes.slogan}>
          Slogan
        </Typography>
        <Typography variant="body1" className={classes.description}>
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus.
        </Typography>
      </Fragment>
      <br></br>
      <br></br>
      <br></br>
    </>
  );

export default withStyles(styles, { withTheme: true })(HomeHeader);
