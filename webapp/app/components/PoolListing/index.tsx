/**
 *
 * PoolListing
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Typography, Button, Table, TableHead, TableCell, TableBody, TableRow, Grid } from '@material-ui/core';
import { Pool } from 'containers/App';

const styles = ({ palette }: Theme) =>
  createStyles({
    pageHeader: {
      justifyContent: 'space-between',
    },
    tableHeader: {
      backgroundColor: 'lightgrey',
      borderTop: '#fd9920 2px solid',
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  pools: Array<Pool>,
  createPool(): void,
}

const PoolListing: React.FunctionComponent<OwnProps> = ({ pools, classes, createPool }: OwnProps) => (
  <Container maxWidth='lg'>
    <Grid container direction='row' className={classes.pageHeader}>
      <Typography variant='h3'>Pool Overview</Typography>
      <Button onClick={() => createPool()}> Create New Pool</Button>
    </Grid>
    <Table>
      <TableHead className={classes.tableHeader}>
        <TableRow>
          <TableCell>Pool Name</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Period</TableCell>
          <TableCell>Pool Cap</TableCell>
          <TableCell>Pool Participants</TableCell>
          <TableCell>Interest Rate (%)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {pools.map(p => (
          <TableRow key={p.address}>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.type}</TableCell>
            <TableCell>{p.period}</TableCell>
            <TableCell>{p.cap}</TableCell>
            <TableCell>{p.participants}</TableCell>
            <TableCell>{(p.interestRate * 100).toFixed(2)}</TableCell>
          </TableRow>))}
      </TableBody>
    </Table>
  </Container>
);

export default withStyles(styles, { withTheme: true })(PoolListing);
