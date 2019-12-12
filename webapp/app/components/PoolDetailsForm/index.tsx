/**
 *
 * PoolDetailsForm
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Button, Typography, Container, MenuItem, Grid } from '@material-ui/core';
import { Form, FastField } from 'formik';
import { TextField } from 'formik-material-ui';

const styles = (theme: Theme) =>
  createStyles({
    // JSS in CSS goes here
  });

interface OwnProps extends WithStyles<typeof styles> {
  poolTypes: Array<{ value: number, label: string }>,
  periods: Array<{ value: number, label: string }>,
}

const PoolDetailsForm: React.FunctionComponent<OwnProps> = (
  { poolTypes, periods }: OwnProps,
) => <Container maxWidth='sm'>
    <Form>
      <Typography variant='h3'>Create Pool</Typography>
      <Grid container direction='column'>
        <FastField
          name='name'
          type='text'
          label='Name'
          component={TextField} />
        <FastField
          name='type'
          label='Type'
          select
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
