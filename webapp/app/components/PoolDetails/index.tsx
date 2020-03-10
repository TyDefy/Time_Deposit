/**
 *
 * PoolDetails
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, Chip, Table, TableHead, TableRow, TableCell, TableBody, Button, Tooltip } from '@material-ui/core';
import dayjs from 'dayjs';
import { Pool } from 'containers/App';
import Zoom from '@material-ui/core/Zoom';

const styles = ({ spacing , palette }: Theme) =>
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
    label:{
      fontSize: '1em',
      opacity: '60%',
      fontWeight: 'bold',
      margin: "12px 8px 0px 12px"
    },
    profitLabel:{
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
  showModal(value: 'invest' | 'withdrawInterest' | 'withdrawAll'): void
  withdrawAll(): void;
}

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
  penaltyRate,
  availableInterest,
  description,
  transactions,
  active,
  showModal,
  withdrawAll
}: OwnProps) => (
    <Container maxWidth='lg'>
      <Grid container direction='row' className={classes.poolDetailsHeaderRow}>
        <Grid item xs={4}><Typography variant='h3' className={classes.poolName}>{name}</Typography></Grid>
        <Grid item xs={4}><Chip className={classes.period} label={period == 0 ? 'Rolling' : `${period} month(s)`} /> <Chip className={(active) ? classes.poolActive : classes.poolTerminated} label={(active) ? `Active` : `Terminated`} /></Grid>
        <Grid item xs={4}>
          <Typography className={classes.currentInterest}>
            Current Interest:  
            <strong className={classes.percentageInterest}>
              {`${((interestRate || 0) * 100).toFixed(2)} %`}
            </strong>
          </Typography>
        </Grid>
      </Grid>
      <br/>
      <Grid container direction='row' spacing={0} className={classes.poolDetailsRow}>
        <Grid item xs={12}>
          <Typography className={classes.value}>{description}</Typography>
        </Grid>
      </Grid>
      <br/>
      <Grid container direction='row' spacing={0} className={classes.poolDetailsRow}>
        <Grid item xs={3}>
        <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Financial investment instrument used in this Pool." placement="top">
          <Typography className={classes.label}>Instrument</Typography>
          </Tooltip>
          <Typography className={classes.value}>{type}</Typography>
        </Grid>
        <Grid item xs={3}>
        <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Total amount invested in this Pool." placement="top">
          <Typography className={classes.label}>Pool Total</Typography>
          </Tooltip>
          <Typography className={classes.value}>{balance.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={3}>
        <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Number of invested participants in the Pool." placement="top">
          <Typography className={classes.label}>Pool Participants</Typography>
          </Tooltip>
          <Typography className={classes.value}>{participants}</Typography>
        </Grid>
        <Grid item xs={3}>
        <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Penalty percentage taken on withdrawals." placement="top">
          <Typography className={classes.label}>Pool Penalty</Typography>
          </Tooltip>
          <Typography className={classes.value}>{penaltyRate} %</Typography>
        </Grid>
      </Grid>
      <br/>
      <Grid container direction='row' className={classes.poolDetailsRow}>
        <Grid item xs={3}>
        <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Your total invested amount." placement="top">
          <Typography  className={classes.label}>Purchase Value</Typography>
          </Tooltip>
          <Typography  className={classes.value}>{(contribution || 0).toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={3}>
        <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Your total interest earned on purchase value." placement="top">
          <Typography className={classes.profitLabel}>Interest Earned</Typography>
          </Tooltip>
          <Typography className={classes.profitValue}>{(interestAccrued || 0).toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={3}>
        <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Your available profit that can be withdrawn without penalty (includes penalties)." placement="top">
          <Typography  className={classes.label}>Available Profit</Typography>
          </Tooltip>
          <Typography  className={classes.value}>{(availableInterest || 0).toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={3}>
        </Grid>
      </Grid>
      <br/>
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
      <Grid container direction='row' justify='space-around' className={classes.buttonBar}>
        {
          active? 
          <>
          <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Lock in an investment." placement="top">
          <Button className={classes.button} color='primary' onClick={() => showModal('invest')}>INVEST</Button>
          </Tooltip>
          <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Withdraw your available profit and rewarded penalties." placement="top">
          <Button className={classes.button} color='primary' onClick={() => showModal('withdrawInterest')}>WITHDRAW PROFIT</Button>
          </Tooltip>
          <Tooltip enterDelay={500} leaveDelay={200} TransitionComponent={Zoom} title="Withdraw your full investment and profit. Penalties are incurred if pool terms have not been met." placement="top">
          <Button className={classes.button} color='primary' onClick={() => showModal('withdrawAll')}>WITHDRAW INVESTMENT</Button> 
          </Tooltip>
          </>
          :
          <Tooltip TransitionComponent={Zoom} title="Withdraw your full investment and profit from terminated pool." placement="top">
          <Button className={classes.button} color='primary' onClick={() => withdrawAll()}>WITHDRAW</Button> 
          </Tooltip>
        }

        
      </Grid>
    </Container>
  );

export default withStyles(styles, { withTheme: true })(PoolDetails);
