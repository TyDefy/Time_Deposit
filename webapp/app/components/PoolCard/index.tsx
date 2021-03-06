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

const styles = ( {spacing, transitions}: Theme) =>
  createStyles({
    card: {
      cursor: 'pointer',
    },
    cardHeader: {
      backgroundColor: '#E5E5E5',
      letterSpacing: "2px"
    },
    chip: {
      marginTop: 10,
      marginRight: 20,
    },
    label: {
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      padding: spacing(1),
      textTransform: "uppercase"
    },
    divider: {
      margin: '16px 8px',
    },
    cardMetric: {
      textAlign: "center",
      letterSpacing: "2px"
    },
    value: {
      verticalAlign: "top",
      display: "inline-block",
      float: "right",
      padding: 8,
      textTransform: "uppercase",
      fontWeight: "bold",
      letterSpacing: "2px"
    },
    daysUntil: {
      verticalAlign: "top",
      display: "inline-block",
      float: "right",
      padding: 8,
      paddingBottom: 16,
      textTransform: "uppercase",
      fontWeight: "bold",
      letterSpacing: "4px",
      fontSize: "23px"
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
      fontWeight: "bold",
      color: "green",
      letterSpacing: "2px"
    },
    expand: {
      transform: 'rotate(0deg)',
      marginLeft: 'auto',
      transition: transitions.create('transform', {
        duration: transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
    description: {
      backgroundColor: '#E5E5E5',
      padding: spacing(1),
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
  daysUntilAccess = 0,
}: OwnProps) => {

  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return(
 <>
    <Grid item xs={12} sm={6} md={4}>
      <Card elevation={3} className={classes.card} >
     
        <CardHeader
          className={classes.cardHeader}
          title={name}
          action={
            <>
            <Chip color="primary" className={classes.chip} label={(period === 0) ? 'Rolling' : `${period} months`} />
            <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
            </IconButton>
            </>
          }
        />
         <Collapse in={expanded} timeout="auto" unmountOnExit>
           <Typography className={classes.description}> {description} </Typography>
        </Collapse>
        <CardContent onClick={() => forwardTo(`/pool/${address}`)}>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.topMetricLabel}>
                  {type}
                </Typography>
                <Typography className={classes.topMetricValue}>
                  {`${((interestRate || 0)*100).toFixed(2)} %`}
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
                Penalty free withdrawal
                </Typography>
                <Typography className={classes.value}>
                  {`${availableInterest?.toFixed(2)} DAI`}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              {(period > 0) &&
              <Paper elevation={4} className={classes.cardMetric}>
                <Typography className={classes.label}>
                  Days until access
                </Typography>
                <Typography className={classes.daysUntil}>
                  {daysUntilAccess > 0 ? daysUntilAccess : '-'}
                </Typography>
              </Paper>} 
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
    </>
    )};

export default withStyles(styles, { withTheme: true })(PoolCard);
