/**
 *
 * WithdrawInterestModal
 *
 */

import React, { useState } from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Grid, Typography, Button } from '@material-ui/core';

const styles = ({ palette, spacing }: Theme) =>
  createStyles({
    container: {
      width: spacing(20) * 2
    },
    buttonBar: {

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
  availableInterest: number;
  onClose(): void;
  onSubmit(amount: number): void;
}

const WithdrawInterestModal: React.FC<OwnProps> = ({
  name,
  type,
  availableInterest,
  onClose,
  onSubmit,
  classes
}: OwnProps) => {
  const [value] = useState(availableInterest);
  const submit = () => onSubmit(value);
  return <Container maxWidth='sm' className={classes.container}>
    <Grid container direction='column' alignItems='center'>
      <Typography variant='h6' className={classes.header}>Withdraw Interest</Typography>
      <Typography className={classes.label}>Pool</Typography>
      <Typography className={classes.value}>{`${name} (${type})`}</Typography>
      <Typography className={classes.label}>Penalty free withdrawal</Typography>
      <Typography className={classes.value}>{availableInterest.toFixed(2)}</Typography>
      <Grid container direction='row' justify='space-around' className={classes.buttonBar}>
        <Button color='primary' onClick={onClose}>Cancel</Button>
        <Button color='primary' onClick={submit}>Submit</Button>
      </Grid>
    </Grid>
  </Container>
};

export default withStyles(styles, { withTheme: true })(WithdrawInterestModal);
