/**
 *
 * AdminPoolUserDetails
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, Chip, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { Pool } from 'containers/App';
import dayjs from 'dayjs';

const styles = ({ spacing, palette }: Theme) =>
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
      margin: "20px 0 0 8px",
      fontWeight: 'bold',
    },
    period: {
      verticalAlign: "top",
      display: "inline-block",
      float: "left",
      padding: 8,
      margin: "25px 20px 0 20px"
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
      opacity: '60%',
      fontWeight: 'bold',
      margin: "12px 8px 0px 12px"
    },
    profitLabel: {
      fontSize: '1em',
      opacity: '60%',
      fontWeight: 'bold',
      margin: "12px 8px 0px 12px",
      color: 'green',
    },
    value: {
      fontSize: '1.5em',
      margin: "8px 8px 0px 12px"
    },
    profitValue: {
      fontSize: '1.5em',
      margin: "8px 8px 0px 12px",
      color: 'green',
    },
    button: {
      width: spacing(20)
    },
    buttonBar: {
      marginTop: spacing(8)
    }
  });

interface OwnProps extends WithStyles<typeof styles>, Pool {
  userAddress: string,
}

const AdminPoolUserDetails: React.FC<OwnProps> = ({
  classes,
  name,
  period,
  interestRate,
  contribution,
  interestAccrued,
  availableInterest,
  userAddress,
  transactions,
  active,
}: OwnProps) => (
    <Container maxWidth='lg'>
      <Grid container direction='row' className={classes.poolDetailsHeaderRow}>
        <Grid item xs={3}><Typography variant='h3' className={classes.poolName}>{name}</Typography></Grid>
        <Grid item xs={3}><Chip className={classes.period} label={`${period} month(s)`} /></Grid>
        <Grid item xs={3}><Chip className={(active) ? classes.poolActive : classes.poolTerminated} label={(active) ? `Active` : `Terminated`} /></Grid>
        <Grid item xs={3}>
          <Typography className={classes.currentInterest}>
            Current Interest:
        <strong className={classes.percentageInterest}>
              {`${((interestRate || 0) * 100).toFixed(2)} %`}
            </strong>
          </Typography>
        </Grid>
      </Grid>
      <br />
      <Grid container direction='row' spacing={0} className={classes.poolDetailsRow}>
        <Grid item xs={12}>
          <Typography className={classes.value}>User: {userAddress}</Typography>
        </Grid>
      </Grid>
      <br />
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item xs={4}>
          <Typography className={classes.label}>Purchase Value</Typography>
          <Typography className={classes.value}>{(contribution || 0).toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography className={classes.profitLabel}>Profit</Typography>
          <Typography className={classes.profitValue}>{(interestAccrued || 0).toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography className={classes.label}>Penalty free withdrawal</Typography>
          <Typography className={classes.value}>{(availableInterest || 0).toFixed(2)}</Typography>
        </Grid>
      </Grid>
      <br />
      <Table>
        <TableHead className={classes.tableHeader}>
          <TableRow>
            <TableCell>Transaction ID</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions?.map(t =>
            <TableRow key={`${t.txHash}${t.type}`}>
              <TableCell>{t.txHash}</TableCell>
              <TableCell>{dayjs(t.time).format('YYYY-MM-DD HH:mm')}</TableCell>
              <TableCell>{t.type}</TableCell>
              <TableCell>{t.amount.toFixed(2)}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Container>
  );

export default withStyles(styles, { withTheme: true })(AdminPoolUserDetails);
