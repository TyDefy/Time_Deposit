/**
 *
 * PoolDetails
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, Chip, TableHead, TableRow, TableCell, Table, TableBody } from '@material-ui/core';
import { PoolDetails } from 'containers/AdminPoolDetailsPage';
import dayjs from 'dayjs';

const styles = (theme: Theme) =>
  createStyles({
    poolDetailsRow: {
      justifyContent: 'space-around'
    },
    tableHeader: {
      backgroundColor: 'lightgrey',
      borderTop: '#fd9920 2px solid',
    },
  });

interface OwnProps extends WithStyles<typeof styles>, PoolDetails {

}

const AdminPoolDetails: React.FunctionComponent<OwnProps> = ({
  classes,
  name,
  period,
  type,
  interestRate,
  totalStaked,
  participants,
  totalInterest,
  feeRate,
  pentalyRate,
  participantDetails,
}: OwnProps) => (
    <Container maxWidth='lg'>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item><Typography variant='h3'>{name}</Typography></Grid>
        <Grid item><Chip label={`${period} months`} /></Grid>
        <Grid item direction='row'>
          <Typography>Current Interest: <strong>{`${(pentalyRate * 100).toFixed(2)} %`}</strong></Typography>
        </Grid>
      </Grid>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item>
          <Typography>Currency Type</Typography>
          <Typography>{type}</Typography>
        </Grid>
        <Grid item>
          <Typography>Pool Total</Typography>
          <Typography>{totalStaked.toFixed(2)}</Typography>
        </Grid>
        <Grid item>
          <Typography>Pool Participants</Typography>
          <Typography>{participants}</Typography>
        </Grid>
        <Grid item>
          <Typography>Total Interest</Typography>
          <Typography>{totalInterest.toFixed(2)}</Typography>
        </Grid>
        <Grid item>
          <Typography>Fee</Typography>
          <Typography>{`${(feeRate * 100).toFixed(2)} %`}</Typography>
        </Grid>
        <Grid item>
          <Typography>Penalty</Typography>
          <Typography>{`${(pentalyRate * 100).toFixed(2)} %`}</Typography>
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
