/**
 *
 * PoolCard
 *
 */

import React from 'react';
import clsx from 'clsx';
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
  Collapse,
  IconButton
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { Pool } from 'containers/App';
import { forwardTo } from 'utils/history';

const styles = ( theme: Theme) =>
  createStyles({
    card: {
      height: '470px',
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
    },
    expand: {
      transform: 'rotate(0deg)',
      marginLeft: 'auto',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
    description: {
      backgroundColor: '#E5E5E5',
      padding: 8
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
  description,
  balance,
  contribution = 0,
  interestAccrued = 0,
  availableInterest = 0,
  daysUntilAccess=0
}: OwnProps) => {
  
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return(
 
}: OwnProps) => (
    <Grid item xs={12} sm={6} md={4}>
      <Card elevation={3} className={classes.card} >
     
        <CardHeader
          className={classes.cardHeader}
          title={name}
          action={
            <Chip color="primary" className={classes.chip} label={(period === 0) ? 'Rolling' : `${period} months`} />
          }
        />
         <Collapse in={expanded} timeout="auto" unmountOnExit>
           <Typography className={classes.description}> {pool.description} </Typography>
        </Collapse>
        <CardContent onClick={() => forwardTo(`/pool/${pool.address}`)}>
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
    </Grid>)};

export default withStyles(styles, { withTheme: true })(PoolCard);
