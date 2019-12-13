/**
 *
 * Portfolio
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Typography, Card } from '@material-ui/core';
import { Pool } from 'containers/App';

const styles = (theme: Theme) =>
  createStyles({
    // JSS in CSS goes here
  });

interface OwnProps extends WithStyles<typeof styles> {
  totalHoldings: number;
  contributed: number;
  interestAccrued: number;
  interestAvailable: number;
  pools: Array<Pool>;
}

const Portfolio: React.FC<OwnProps> = ({
  totalHoldings,
  contributed,
  interestAccrued,
  interestAvailable,
  pools,
}: OwnProps) => <>
  <Typography variant='h5'>Overview</Typography>
  <Typography variant='subtitle2'>Your Portfolio Summary</Typography>
  <Card>

  </Card>

</>;

export default withStyles(styles, { withTheme: true })(Portfolio);
