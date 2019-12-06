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

const styles = ({ palette }: Theme) =>
  createStyles({
    
    cardContent: {},
    card: {
      width: '400px',
      height: '460px',
      margin: 20,
    },
    cardHeader: {
      backgroundColor: '#E5E5E5',
    },
    chip: {
      marginTop: 10,
      marginRight: 20,
    },
    label: {
      verticalAlign:"top",
      display:"inline-block",
      float: "left" ,
      padding: 8,
      textTransform: "uppercase"
    },
    divider: {
      margin: '16px 8px',
    },
    cardMetric:{
      textAlign: "center" 
    },
    value: {
      verticalAlign:"top",
      display:"inline-block",
      float: "right" ,
      padding: 8,
      textTransform: "uppercase",
      fontWeight: "bold"
    },
    topMetricLabel: {
      fontSize: "25px",
      verticalAlign:"top",
      display:"inline-block",
      float: "left" ,
      padding: 8,
      textTransform: "uppercase"
    },
    topMetricValue: {
      fontSize: "25px",
      verticalAlign:"top",
      display:"inline-block",
      float: "right" ,
      padding: 8,
      textTransform: "uppercase",
      fontWeight: "bold"
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  
}

const PoolCard: React.FunctionComponent<OwnProps> = ({
  classes,
}: OwnProps) => (
  <>

      <Card elevation={3} className={classes.card}>
        <CardHeader
          className={classes.cardHeader}
          title={'Diamond 6'}
          action={
            <Chip color="primary" className={classes.chip} label={'3 Month'} />
          }
        />
        <CardContent className={classes.cardContent}>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.topMetricLabel}>
                  cDAI
                </Typography>
                <Typography className={classes.topMetricValue}>
                  3.5%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
              <Typography className={classes.label}>
                  Pool Total
                </Typography>
                <Typography className={classes.value}>
                  2,000 DAI
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
              <Typography className={classes.label}>
                  Balance
                </Typography>
                <Typography className={classes.value}>
                  200 DAI
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
              <Typography className={classes.label}>
                  Interest
                </Typography>
                <Typography className={classes.value}>
                  10 DAI
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
                 10 DAI
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
              <Typography className={classes.label}>
                 Days until access
                </Typography>
                <Typography className={classes.value}>
                  20 DAYS
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
  </>
);

export default withStyles(styles, { withTheme: true })(PoolCard);
