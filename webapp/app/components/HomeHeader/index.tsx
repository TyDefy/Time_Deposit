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
  poolsBalance: number
}

const HomeHeader: React.FunctionComponent<OwnProps> = ({ poolsBalance, classes }: OwnProps) => (
    <>
      <Fragment>
        <Typography variant="h2" className={classes.mainHeading}>
          TIME DEPOSIT
        </Typography>
        <br></br>
        <Typography variant="h1" className={classes.runningTotal}>
          {`$ ${poolsBalance.toLocaleString(undefined, {maximumFractionDigits:2})}`}
        </Typography>
        <Typography variant="subtitle1" className={classes.subtitle1}>
          Currently contributed to pools
        </Typography>
        <Typography variant="h5" className={classes.slogan}>
        Choose the time. Choose the return. Watch it grow.
        </Typography>
        <Typography variant="h5" className={classes.description}>
        Time Deposit allows you to earn interest on your crypto. Choose your time frame and return and watch your deposit grow. 
        Patience is a virtue - wait until the full term of your deposit has passed and be rewarded. Withdraw early and be penalised. Those who stay invested get rewarded by those who withdraw early! Simple. 
        </Typography>
      </Fragment>
      <br></br>
      <br></br>
      <br></br>
    </>
  );

export default withStyles(styles, { withTheme: true })(HomeHeader);
