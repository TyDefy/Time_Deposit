/**
 *
 * Portfolio
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Typography, Grid, Paper, Container } from '@material-ui/core';
import { Pool } from 'containers/App';
import PoolCardList from 'components/PoolCardList';

const styles = ({ spacing, palette }: Theme) =>
  createStyles({
    poolGrid: {
      paddingLeft: spacing(1),
      paddingRight: spacing(1),
    },
    poolPaper: {
      borderTop: `${palette.primary.main} 2px solid`,
      width: "60%",
      height: 250
    },
    totalHoldingsLabel: {
      margin: "24px 0 0 16px",
      opacity: '60%',
      fontSize: '1em',
      fontWeight: 'bold'
    },
    totalHoldingsValue: {
      margin: "0 0 0 16px",
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      fontSize: '3em',
    },
    holdingsIncrease: {
      margin: "38px 0 0 16px",
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
    },
    label: {
      margin: "24px 0 0 16px",
      opacity: '60%',
      fontSize: '1em',
      fontWeight: 'bold'
    },
    value: {
      margin: "8px 0 0 16px",
      fontSize: '1.5em',
    },
    header: {
      margin: "24px 0 0 8px",
      fontWeight: 'bold'
    },
    subHeading:{
      margin: "16px 0 24px 8px",
      fontSize: '1em',
    },
    totalHoldingsArea:{
      backgroundColor: '#E5E5E5',
      height: 125
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  totalHoldings: number;
  portfolioInterestRate: number;
  contributed: number;
  interestAccrued: number;
  interestAvailable: number;
  pools: Array<Pool>;
}

const Portfolio: React.FC<OwnProps> = ({
  classes,
  totalHoldings,
  portfolioInterestRate,
  contributed,
  interestAccrued,
  interestAvailable,
  pools,
}: OwnProps) => <Container maxWidth='lg'>
    <Typography className={classes.header} variant='h4'>Overview</Typography>
    <Typography className={classes.subHeading} variant='subtitle2'>Your Portfolio Summary</Typography>
    <Paper className={classes.poolPaper}>
      <Grid container>
        <Grid item xs={12} className={classes.totalHoldingsArea}>
          <Typography className={classes.totalHoldingsLabel}>Total Holdings</Typography>
          <Typography className={classes.totalHoldingsValue}>{`${totalHoldings.toFixed(2)} DAI`}</Typography>
          <Typography className={classes.holdingsIncrease}>{`${(portfolioInterestRate * 100).toFixed(2)} %`}</Typography>
        </Grid> 
        <Grid item xs={4}>
          <Typography className={classes.label}>Contributed</Typography>
          <Typography className={classes.value}>{`${contributed.toFixed(2)} DAI`}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography className={classes.label}>Interest Accrued</Typography>
          <Typography className={classes.value}>{`${interestAccrued.toFixed(2)} DAI`}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography className={classes.label}>Interest Available</Typography>
          <Typography className={classes.value}>{`${interestAvailable.toFixed(2)} DAI`}</Typography>
        </Grid>
      </Grid>
    </Paper>
    <br />
    <PoolCardList listLabel='Your Pools' pools={pools} />
  </Container>;

export default withStyles(styles, { withTheme: true })(Portfolio);
