/**
 *
 * WithdrawAllModal
 *
 */

import React, { useState, useEffect } from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, TextField, Button } from '@material-ui/core';

const styles = (theme: Theme) =>
  createStyles({
    // JSS in CSS goes here
  });

interface OwnProps extends WithStyles<typeof styles> {
  name: string;
  type: string;
  availableFunds: number;
  onClose(): void;
  onSubmit(amount: number): void;
}

const WithdrawAllModal: React.FC<OwnProps> = ({
  name,
  type,
  availableFunds,
  onClose,
  onSubmit
}: OwnProps) => {
  const [value, setValue] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const penaltyAmount = value * 0.05 //TODO: fetch this from the contract
      if (!cancelled) {
        setPenaltyAmount(penaltyAmount);
      }
    };
    fetchData();

    return () => { cancelled = true }
  }, [value]);

  const submit = () => onSubmit(value);
  return <Container maxWidth='xs'>
    <Grid container direction='column' alignItems='center'>
      <Typography variant='h6'>Withdraw All</Typography>
      <Typography>Pool</Typography>
      <Typography>{`${name} (${type})`}</Typography>
      <Typography>Available Funds</Typography>
      <Typography>{availableFunds.toFixed(2)}</Typography>
      <Typography>Amount</Typography>
      <TextField type='number' value={value} onChange={(e) => setValue(parseInt(e.target.value))}/>
      <Typography>Penalty</Typography>
      <Typography>{penaltyAmount.toFixed(2)}</Typography>
      <Typography>Total to Receive</Typography>
      <Typography>{(value-penaltyAmount).toFixed(2)}</Typography>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={submit}>Submit</Button>
    </Grid>
  </Container>
};

export default withStyles(styles, { withTheme: true })(WithdrawAllModal);
