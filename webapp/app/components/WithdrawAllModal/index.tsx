/**
 *
 * WithdrawAllModal
 *
 */

import React, { useState, useEffect } from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, TextField, Button } from '@material-ui/core';

const styles = ({palette, spacing}: Theme) =>
  createStyles({
    container: {
      width: spacing(20)*2
    },
    buttonBar :{

    },
    header: {
      margin: spacing(3),
      fontWeight: "bold"
    },
    label: {
      fontSize: '1em',
      opacity: '60%',
      fontWeight: 'bold',
      margin: "12px 8px 0px 12px"
    },
    value: {
      fontSize: '1.5em',
      margin: "8px 8px 0px 12px"
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  name: string;
  type: string;
  availableFunds: number;
  penaltyRate: number;
  onClose(): void;
  onSubmit(amount: number): void;
}

const WithdrawAllModal: React.FC<OwnProps> = ({
  name,
  type,
  availableFunds,
  penaltyRate,
  onClose,
  onSubmit,
  classes
}: OwnProps) => {
  const [value, setValue] = useState(0);
  const [penaltyAmount, setPenaltyAmount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const penaltyAmount = value * (penaltyRate/100);
      if (!cancelled) {
        setPenaltyAmount(penaltyAmount);
      }
    };
    fetchData();

    return () => { cancelled = true }
  }, [value]);

  const submit = () => onSubmit(value);
  return <Container maxWidth='sm' className={classes.container}>
    <Grid container direction='column' alignItems='center'>
      <Typography className={classes.header} variant='h6'>Withdraw All</Typography>
      <Typography className={classes.label}>Pool</Typography>
      <Typography className={classes.value}>{`${name} (${type})`}</Typography>
      <Typography className={classes.label}>Available Funds</Typography>
      <Typography className={classes.value}>{availableFunds.toFixed(2)}</Typography>
      <Typography className={classes.label}>Amount</Typography>
      <TextField type='number' value={value} onChange={(e) => setValue(parseInt(e.target.value))}/>
      <Typography className={classes.label}>Penalty</Typography>
      <Typography className={classes.value}>{penaltyAmount.toFixed(2)}</Typography>
      <Typography className={classes.label}>Total to Receive</Typography>
      <Typography className={classes.value}>{(value-penaltyAmount).toFixed(2)}</Typography>
      <Grid container direction='row' justify='space-around' className={classes.buttonBar}>
      <Button color='primary' onClick={onClose}>Cancel</Button>
      <Button color='primary' onClick={submit}>Submit</Button>
      </Grid>
    </Grid>
  </Container>
};

export default withStyles(styles, { withTheme: true })(WithdrawAllModal);
