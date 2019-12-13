/**
 *
 * Portfolio
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Typography, Grid, Paper } from '@material-ui/core';
import { Pool } from 'containers/App';
import PoolCardList from 'components/PoolCardList';

const styles = ({spacing, palette}: Theme) =>
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
}: OwnProps) => <>  
    <Typography variant='h5'>Overview</Typography>
    <Typography variant='subtitle2'>Your Portfolio Summary</Typography>
    <Paper className={classes.poolPaper}>
      <Grid container direction='column'>
        <Grid item xs={12}>
          <Typography>Total Holdings</Typography>
          <Typography>{`${totalHoldings.toFixed(2)} DAI`}</Typography>
          <Typography>{`${(portfolioInterestRate*100).toFixed(2)} %`}</Typography>
          <Typography>Contributed</Typography>
          <Typography>{`${contributed.toFixed(2)} DAI`}</Typography>
          <Typography>Interest Accrued</Typography>
          <Typography>{`${interestAccrued.toFixed(2)} DAI`}</Typography>
          <Typography>Interest Available</Typography>
          <Typography>{`${interestAvailable.toFixed(2)} DAI`}</Typography>
        </Grid>
      </Grid>
    </Paper>
    <PoolCardList listLabel='Your Pools' pools={pools} />
  </>;

export default withStyles(styles, { withTheme: true })(Portfolio);
