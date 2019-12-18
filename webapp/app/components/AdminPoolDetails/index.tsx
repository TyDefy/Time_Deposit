/**
 *
 * PoolDetails
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, Chip, TableHead, TableRow, TableCell, Table, TableBody } from '@material-ui/core';
import { PoolDetails } from 'containers/AdminPoolDetailsPage';
import dayjs from 'dayjs';

const styles = ({palette}: Theme) =>
  createStyles({
    poolDetailsHeaderRow: {
      justifyContent: 'space-around',
      width: '100%'
    },
    poolDetailsRow: {
      justifyContent: 'space-around',
      width: '60%'
    },
    tableHeader: {
      backgroundColor: 'lightgrey',
      borderTop: `${palette.primary.main} 2px solid`,
    },
    poolName: {
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      margin: "20px 0 0 8px"
    },
    period: {
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      padding: 8,
      margin: "25px 20px 0 20px"
    },
    currentInterest: {
      verticalAlign: "top",
      
      display: "inline-block",
      float: "right",
      margin: "25px 20px 0 20px"
    },
    percentageInterest: {

    },
    label:{
      fontSize: '1em',
      opacity: '75%',
      margin: "12px 8px 0px 12px"
    },
    value: {
      fontSize: '1.5em',
      margin: "8px 8px 0px 12px"
    }
  });

interface OwnProps extends WithStyles<typeof styles>, PoolDetails {

}

const AdminPoolDetails: React.FunctionComponent<OwnProps> = ({
  classes,
  name,
  period,
  type,
  interestRate,
  balance: totalStaked,
  participants,
  totalInterest,
  feeRate,
  pentalyRate,
  participantDetails,
}: OwnProps) => (
    <Container maxWidth='lg'>
       <Grid container direction='row' className={classes.poolDetailsHeaderRow}>
        <Grid item xs={4}><Typography variant='h3' className={classes.poolName}>{name}</Typography></Grid>
        <Grid item xs={4}><Chip className={classes.period} label={`${period} month(s)`} /></Grid>
        <Grid item xs={4}>
          <Typography className={classes.currentInterest}>Current Interest: <strong className={classes.percentageInterest}>{`${(interestRate * 100).toFixed(2)} %`}</strong></Typography>
        </Grid>
      </Grid>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item xs={1}>
          <Typography className={classes.label}>Currency Type</Typography>
          <Typography className={classes.value}>{type}</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography className={classes.label}>Pool Total</Typography>
          <Typography className={classes.value}>{totalStaked.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography className={classes.label}>Pool Participants</Typography>
          <Typography className={classes.value}>{participants}</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography className={classes.label}>Total Interest</Typography>
          <Typography className={classes.value}>{totalInterest.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography className={classes.label}>Fee</Typography>
          <Typography className={classes.value}>{`${(feeRate * 100).toFixed(2)} %`}</Typography>
        </Grid>
        <Grid item xs={1}>
          <Typography className={classes.label}>Penalty</Typography>
          <Typography className={classes.value}>{`${(pentalyRate * 100).toFixed(2)} %`}</Typography>
        </Grid>
      </Grid>
      <Table>
        <TableHead className={classes.tableHeader}>
          <TableRow>
            <TableCell>Participant</TableCell>
            <TableCell>Date Joined</TableCell>
            <TableCell>Contributed</TableCell>
            <TableCell>Interest</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {participantDetails.map(p => 
            <TableRow>
              <TableCell>{p.address}</TableCell>
              <TableCell>{dayjs(p.joined).format('YYYY-MM-DD')}</TableCell>
              <TableCell>{p.contributed.toFixed(2)}</TableCell>
              <TableCell>{p.interest.toFixed(2)}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Container>
  );

export default withStyles(styles, { withTheme: true })(AdminPoolDetails);
