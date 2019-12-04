/**
 *
 * PoolListing
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Typography, Button, Table, TableHead, TableCell, TableBody, TableRow } from '@material-ui/core';
import { Pool } from "containers/Pool";

const styles = (theme: Theme) =>
  createStyles({
  });

interface OwnProps extends WithStyles<typeof styles> {
  pools: Array<Pool>,
}

const PoolListing: React.FunctionComponent<OwnProps> = ({ pools }: OwnProps) => (
  <Container maxWidth='lg'>
    <Typography variant='h1'>Pool Overview</Typography>
    <Button> Create New Pool</Button>

    <Table>
      <TableHead>
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
            <TableCell>{p.interestRate}</TableCell>
          </TableRow>))}
      </TableBody>
    </Table>
  </Container>
);

export default withStyles(styles, { withTheme: true })(PoolListing);
