/**
 *
 * PoolCardList
 *
 */

import React from 'react';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles,
  Typography,
  Paper,
  Grid,
} from '@material-ui/core';
import { Pool } from 'containers/App';
import PoolCard from 'components/PoolCard';

const styles = ({ palette, spacing }: Theme) =>
  createStyles({
    poolHeader: {
      paddingTop: '32px',
      paddingBottom: '16px',
      textAlign: 'center',
    },
    poolPaper: {
      borderTop: '#fd9920 2px solid',
      paddingBottom: '16px',
    },
    poolGrid: {
      paddingLeft: spacing(1),
      paddingRight: spacing(1),
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  pools: Array<Pool>;
}

const PoolCardList: React.FunctionComponent<OwnProps> = ({
  pools,
  classes,
}: OwnProps) => (
    <>
      <Paper elevation={5} className={classes.poolPaper}>
        <Typography variant="h5" className={classes.poolHeader}>
          Available Pools
        </Typography>
        <Grid container spacing={1} direction="row" justify='space-around' className={classes.poolGrid}>
          {pools.map(p => <PoolCard key={p.address} pool={p} />)}
        </Grid>
      </Paper>
    </>
  );

export default withStyles(styles, { withTheme: true })(PoolCardList);
