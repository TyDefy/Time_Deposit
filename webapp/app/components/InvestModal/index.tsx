/**
 *
 * InvestModal
 *
 */

import React, { useState } from 'react';
import { Theme, createStyles, withStyles, WithStyles, Typography, TextField, Button, Container, Grid } from '@material-ui/core';
import dayjs from 'dayjs';

const styles = ({ palette, spacing }: Theme) =>
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
  classes
}: OwnProps) => {
  const [value, setValue] = useState(0);
  const submit = () => onSubmit(value);
  return <Container maxWidth='xs' className={classes.container}>
    <Grid container direction='column' alignItems='center'>
      <Typography variant='h6' className={classes.header}>Invest</Typography>
      <Typography className={classes.label}>Pool</Typography>
      <Typography className={classes.value}>{`${name} (${type})`}</Typography>
      <Typography className={classes.label}>DAI Balance</Typography>
      <Typography className={classes.value}>{daiBalance.toFixed(2)}</Typography>
      <Typography className={classes.label}>Current Interest Rate</Typography>
      <Typography className={classes.value}>{(currentInterestRate * 100).toFixed(2)}</Typography>
      <Typography className={classes.label}>Next Withdraw Date</Typography>
      <Typography className={classes.value}>{dayjs(nextWithdrawlDate).format('YYYY-MM-DD')}</Typography>
      <Typography className={classes.label}>Amount to invest</Typography>
      <TextField type='number' value={value} onChange={(e) => setValue(parseInt(e.target.value))}/>
      <Grid container direction='row' justify='space-around' className={classes.buttonBar}>
      <Button color='primary' onClick={onClose}>Cancel</Button>
      <Button color='primary' onClick={submit}>Submit</Button>
    </Grid>
    </Grid>
  </Container>
};

export default withStyles(styles, { withTheme: true })(InvestModal);
