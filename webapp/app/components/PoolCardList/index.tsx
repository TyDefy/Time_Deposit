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
      borderTop: `${palette.primary.main} 2px solid`,
      paddingBottom: '16px',
    },
    poolGrid: {
      paddingLeft: spacing(1),
      paddingRight: spacing(1),
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  listLabel: string;
  pools: Array<Pool>;
  interestRate: number;
  exchangeRate: number;
}

const PoolCardList: React.FunctionComponent<OwnProps> = ({
  classes,
  listLabel,
  pools,
  interestRate,
  exchangeRate
}: OwnProps) => (
    <>
      <Paper elevation={5} className={classes.poolPaper}>
        <Typography variant="h5" className={classes.poolHeader}>
          {listLabel}
        </Typography>
        <Grid container spacing={1} direction="row" justify='space-around' className={classes.poolGrid}>
          {pools.map(p => <PoolCard key={p.address} {...p} baseInterestRate={interestRate} exchangeRate={exchangeRate} />)}
        </Grid>
      </Paper>
    </>
  );

export default withStyles(styles, { withTheme: true })(PoolCardList);
