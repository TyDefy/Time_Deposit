/**
 *
 * PoolCard
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
  CardHeader,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
} from '@material-ui/core';
import { Pool } from 'containers/App';
import { forwardTo } from 'utils/history';

const styles = ({ palette }: Theme) =>
  createStyles({
    card: {
      height: '460px',
    },
    cardHeader: {
      backgroundColor: '#E5E5E5',
    },
    chip: {
      marginTop: 10,
      marginRight: 20,
    },
    label: {
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      padding: 8,
      textTransform: "uppercase"
    },
    divider: {
      margin: '16px 8px',
    },
    cardMetric: {
      textAlign: "center"
    },
    value: {
      verticalAlign: "top",
      display: "inline-block",
      float: "right",
      padding: 8,
      textTransform: "uppercase",
      fontWeight: "bold"
    },
    topMetricLabel: {
      fontSize: "25px",
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      padding: 8,
      textTransform: "uppercase"
    },
    topMetricValue: {
      fontSize: "25px",
      verticalAlign: "top",
      display: "inline-block",
      float: "right",
      padding: 8,
      textTransform: "uppercase",
      fontWeight: "bold"
    }
  });

interface OwnProps extends Pool, WithStyles<typeof styles> {

}

const PoolCard: React.FunctionComponent<OwnProps> = ({
  classes,
  address,
  name,
  period,
  type,
  interestRate,
  balance,
  contribution = 0,
  interestAccrued = 0,
  availableInterest = 0,
  daysUntilAccess=0
}: OwnProps) => (
    <Grid item xs={12} sm={6} md={4}>
      <Card elevation={3} className={classes.card} onClick={() => forwardTo(`/pool/${address}`)}>
        <CardHeader
          className={classes.cardHeader}
          title={name}
          action={
            <Chip color="primary" className={classes.chip} label={(period === 0) ? 'Rolling' : `${period} months`} />
          }
        />
        <CardContent>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.topMetricLabel}>
                  {type}
                </Typography>
                <Typography className={classes.topMetricValue}>
                  {`${(interestRate*100).toFixed(2)} %`}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.label}>
                  Pool Total
                </Typography>
                <Typography className={classes.value}>
                  {`${balance.toFixed(2)} DAI`}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.label}>
                  Balance
                </Typography>
                <Typography className={classes.value}>
                  {`${contribution?.toFixed(2)} DAI`}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.label}>
                  Interest
                </Typography>
                <Typography className={classes.value}>
                  {`${interestAccrued?.toFixed(2)} DAI`}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          <Divider className={classes.divider} />
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.label}>
                  Available Interest
                </Typography>
                <Typography className={classes.value}>
                  {`${availableInterest?.toFixed(2)} DAI`}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.label}>
                  Days until access
                </Typography>
                <Typography className={classes.value}>
                  {`${daysUntilAccess?.toFixed(2)}`}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );

export default withStyles(styles, { withTheme: true })(PoolCard);
