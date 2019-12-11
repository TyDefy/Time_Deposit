/**
 *
 * InvestModal
 *
 */

import React, { useState } from 'react';
import { Theme, createStyles, withStyles, WithStyles, Typography, TextField, Button, Container, Grid } from '@material-ui/core';
import dayjs from 'dayjs';

const styles = (theme: Theme) =>
  createStyles({
    // JSS in CSS goes here
  });

interface OwnProps extends WithStyles<typeof styles> {
  name: string;
  type: string;
  daiBalance: number;
  currentInterestRate: number;
  nextWithdrawlDate: Date;
  onClose(): void;
  onSubmit(amount: number): void;
}

const InvestModal: React.FC<OwnProps> = ({
  name,
  daiBalance,
  type,
  currentInterestRate,
  nextWithdrawlDate,
  onClose,
  onSubmit,
}: OwnProps) => {
  const [value, setValue] = useState(0);
  const submit = () => onSubmit(value);
  return <Container maxWidth='xs'>
    <Grid container direction='column' alignItems='center'>
      <Typography variant='h6'>Invest</Typography>
      <Typography>Pool</Typography>
      <Typography>{`${name} (${type})`}</Typography>
      <Typography>DAI Balance</Typography>
      <Typography>{daiBalance.toFixed(2)}</Typography>
      <Typography>Current Interest Rate</Typography>
      <Typography>{(currentInterestRate * 100).toFixed(2)}</Typography>
      <Typography>Next Withdraw Date</Typography>
      <Typography>{dayjs(nextWithdrawlDate).format('YYYY-MM-DD')}</Typography>
      <Typography>Amount to invest</Typography>
      <TextField type='number' value={value} onChange={(e) => setValue(parseInt(e.target.value))}/>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={submit}>Submit</Button>
    </Grid>
  </Container>
};

export default withStyles(styles, { withTheme: true })(InvestModal);
