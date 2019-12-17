/**
 *
 * WithdrawInterestModal
 *
 */

import React, { useState } from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, TextField, Button } from '@material-ui/core';

const styles = (theme: Theme) =>
  createStyles({
    // JSS in CSS goes here
  });

interface OwnProps extends WithStyles<typeof styles> {
  name: string;
  type: string;
  availableInterest: number;
  onClose(): void;
  onSubmit(amount: number): void;
}

const WithdrawInterestModal: React.FC<OwnProps> = ({
  name,
  type,
  availableInterest,
  onClose,
  onSubmit
}: OwnProps) => {
  const [value, setValue] = useState(0);
  const submit = () => onSubmit(value);
  return <Container maxWidth='sm'>
    <Grid container direction='column' alignItems='center'>
      <Typography variant='h6'>Withdraw Interest</Typography>
      <Typography>Pool</Typography>
      <Typography>{`${name} (${type})`}</Typography>
      <Typography>Available Interest</Typography>
      <Typography>{availableInterest.toFixed(2)}</Typography>
      <Typography>Amount</Typography>
      <TextField type='number' value={value} onChange={(e) => setValue(parseInt(e.target.value))}/>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={submit}>Submit</Button>
    </Grid>
  </Container>
};

export default withStyles(styles, { withTheme: true })(WithdrawInterestModal);
