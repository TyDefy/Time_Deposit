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
      padding: spacing(2),
    },
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
    <Typography variant='h5'>Overview</Typography>
    <Typography variant='subtitle2'>Your Portfolio Summary</Typography>
    <Paper className={classes.poolPaper}>
      <Grid container>
        <Grid item xs={12}>
          <Typography>Total Holdings</Typography>
          <Typography>{`${totalHoldings.toFixed(2)} DAI`}</Typography>
          <Typography>{`${(portfolioInterestRate * 100).toFixed(2)} %`}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Contributed</Typography>
          <Typography>{`${contributed.toFixed(2)} DAI`}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Interest Accrued</Typography>
          <Typography>{`${interestAccrued.toFixed(2)} DAI`}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Interest Available</Typography>
          <Typography>{`${interestAvailable.toFixed(2)} DAI`}</Typography>
        </Grid>
      </Grid>
    </Paper>
    <br />
    <PoolCardList listLabel='Your Pools' pools={pools} />
  </Container>;

export default withStyles(styles, { withTheme: true })(Portfolio);
