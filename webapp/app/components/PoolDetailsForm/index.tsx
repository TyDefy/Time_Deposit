/**
 *
 * PoolDetailsForm
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Button, Typography, Container, MenuItem, Grid } from '@material-ui/core';
import { Form, FastField } from 'formik';
import { TextField } from 'formik-material-ui';

const styles = ({spacing}: Theme) =>
  createStyles({
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
  poolTypes: Array<{ value: number, label: string }>,
  periods: Array<{ value: number, label: string }>,
}

const PoolDetailsForm: React.FunctionComponent<OwnProps> = (
  { poolTypes, periods, classes }: OwnProps,
) => <Container maxWidth='sm'>
    <Form>
      <Typography variant='h3' className={classes.header}>Create Pool</Typography>
      <Grid container direction='column'>
        <FastField
          name='name'
          type='text'
          label='Name'
          component={TextField} />
          <FastField
          name='description'
          type='text'
          multiline
          rows='5'
          rowsMax='5'
          label='Description'
          component={TextField} />
        <FastField
          name='type'
          label='Type'
          select
          className={classes.label}
          component={TextField}>
          {poolTypes.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </FastField>
        <FastField
          name='period'
          type='text'
          label='Period'
          select
          className={classes.label}
          component={TextField}>
          {periods.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </FastField>
        <FastField
          name='feeRate'
          type='number'
          label='Fee'
          component={TextField} 
          inputProps={{
            min: 0,
            max: 100,
            step: 1
          }} />
        <FastField
          name='penaltyRate'
          type='number'
          label='Penalty'
          component={TextField}
          inputProps={{
            min: 0,
            max: 100,
            step: 1
          }} />
        <Button type='submit'>Create Pool</Button>
      </Grid>
    </Form>
  </Container>;

export default withStyles(styles, { withTheme: true })(PoolDetailsForm);
