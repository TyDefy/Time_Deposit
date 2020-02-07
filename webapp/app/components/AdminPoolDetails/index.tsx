/**
 *
 * PoolDetails
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, Chip, TableHead, TableRow, TableCell, Table, TableBody, Button } from '@material-ui/core';
import { PoolDetails } from 'containers/AdminPoolDetailsPage';
import dayjs from 'dayjs';

const styles = ({ spacing, palette }: Theme) =>
  createStyles({
    poolDetailsHeaderRow: {
      justifyContent: 'space-around',
      width: '100%'
    },
    poolDetailsRow: {
      justifyContent: 'space-around',
      width: '100%',
      marginTop: spacing(3),
      marginBottom: spacing(3)
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
    poolActive: {
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      padding: 8,
      margin: "25px 20px 0 20px",
      backgroundColor: 'green'
    },
    poolTerminated: {
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      padding: 8,
      margin: "25px 20px 0 20px",
      backgroundColor: 'red'
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
      margin: "25px 20px 0 20px",
      fontSize: '1.5em'
    },
    percentageInterest: {
      color: 'green',
      marginLeft: "8px"
    },
    label: {
      fontSize: '1em',
      opacity: '75%',
      margin: "12px 8px 0px 12px"
    },
    value: {
      fontSize: '1.5em',
      margin: "8px 8px 0px 12px"
    },
    terminateButton: {
      backgroundColor: 'red'
    }
  });

interface OwnProps extends WithStyles<typeof styles>, PoolDetails {
  terminatePool(): void;
  withdrawPoolFee(): void;
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
  penaltyRate,
  description,
  participantDetails,
  terminatePool,
  active
}: OwnProps) => (
    <Container maxWidth='lg'>
      <Grid container direction='row' className={classes.poolDetailsHeaderRow}>
        <Grid item xs={3}><Typography variant='h3' className={classes.poolName}>{name}</Typography></Grid>
        <Grid item xs={3}><Chip className={classes.period} label={`${period} month(s)`} /></Grid>
        <Grid item xs={3}>
          <Chip 
            className={(active) ? classes.poolActive : classes.poolTerminated} 
            label={(active) ? `Active` : `Terminated`} />
        </Grid>
        <Grid item xs={3}>
          <Typography className={classes.currentInterest}>
            Current Interest:
            <strong className={classes.percentageInterest}>
              {`${((interestRate || 0) * 100).toFixed(2)} %`}
            </strong>
          </Typography>
        </Grid>
      </Grid>
      <Grid container direction='row' spacing={0} className={classes.poolDetailsRow}>
        <Grid item xs={12}>
          <Typography className={classes.value}>{description}</Typography>
        </Grid>
      </Grid>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item xs={2}>
          <Typography className={classes.label}>Currency Type</Typography>
          <Typography className={classes.value}>{type}</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.label}>Pool Total</Typography>
          <Typography className={classes.value}>{totalStaked.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.label}>Pool Participants</Typography>
          <Typography className={classes.value}>{participants}</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.label}>Total Interest</Typography>
          <Typography className={classes.value}>{totalInterest.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.label}>Fee</Typography>
          <Typography className={classes.value}>{`${(feeRate).toFixed(2)} %`}</Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography className={classes.label}>Penalty</Typography>
          <Typography className={classes.value}>{`${(penaltyRate).toFixed(2)} %`}</Typography>
        </Grid>
      </Grid>
      <Grid container direction="row">
        <Button onClick={terminatePool} className={classes.terminateButton}>Terminate Pool</Button>
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
            <TableRow key={p.address}>
              <TableCell>{p.address}</TableCell>
              <TableCell>{dayjs(p.joined).format('YYYY-MM-DD')}</TableCell>
              <TableCell>{p?.contributed?.toFixed(2)}</TableCell>
              <TableCell>{p?.interest?.toFixed(2)}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Container>
  );

export default withStyles(styles, { withTheme: true })(AdminPoolDetails);
