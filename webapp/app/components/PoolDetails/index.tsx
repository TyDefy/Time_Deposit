/**
 *
 * PoolDetails
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, Chip, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@material-ui/core';
import dayjs from 'dayjs';
import { UserPoolDetails } from 'containers/PoolDetailsPage';

const styles = ({ palette }: Theme) =>
  createStyles({
    poolDetailsRow: {
      justifyContent: 'space-around'
    },
    tableHeader: {
      backgroundColor: 'lightgrey',
      borderTop: `${palette.primary.main} 2px solid`,
    },
  });

interface OwnProps extends WithStyles<typeof styles>, UserPoolDetails { }

const PoolDetails: React.FunctionComponent<OwnProps> = ({
  classes,
  name,
  period,
  type,
  interestRate,
  balance,
  participants,
  contribution,
  interestAccrued,
  availableInterest,
  transactions
}: OwnProps) => (
    <Container maxWidth='lg'>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item><Typography variant='h3'>{name}</Typography></Grid>
        <Grid item><Chip label={`${period} month(s)`} /></Grid>
        <Grid item direction='row'>
          <Typography>Current Interest: <strong>{`${(interestRate * 100).toFixed(2)} %`}</strong></Typography>
        </Grid>
      </Grid>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item>
          <Typography>Currency Type</Typography>
          <Typography>{type}</Typography>
        </Grid>
        <Grid item>
          <Typography>Pool Total</Typography>
          <Typography>{balance.toFixed(2)}</Typography>
        </Grid>
        <Grid item>
          <Typography>Pool Participants</Typography>
          <Typography>{participants}</Typography>
        </Grid>
      </Grid>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item>
          <Typography>Your contribution</Typography>
          <Typography>{contribution}</Typography>
        </Grid>
        <Grid item>
          <Typography>Your Interest</Typography>
          <Typography>{interestAccrued.toFixed(2)}</Typography>
        </Grid>
        <Grid item>
          <Typography>Available Interest</Typography>
          <Typography>{availableInterest}</Typography>
        </Grid>
      </Grid>
      <Table>
        <TableHead className={classes.tableHeader}>
          <TableRow>
            <TableCell>Participant</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map(t =>
            <TableRow>
              <TableCell>{t.address}</TableCell>
              <TableCell>{dayjs(t.time).format('YYYY-MM-DD HH:mm')}</TableCell>
              <TableCell>{t.type}</TableCell>
              <TableCell>{t.amount.toFixed(2)}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      <Grid container direction='row' justify='space-around'>
        <Button color='primary' onClick={() => {}}>INVEST</Button>
        <Button color='primary' onClick={() => {}}>WITHDRAW INTEREST</Button>
        <Button color='primary' onClick={() => {}}>WITHDRAW & CLOSE</Button>
      </Grid>
    </Container>
  );

export default withStyles(styles, { withTheme: true })(PoolDetails);
