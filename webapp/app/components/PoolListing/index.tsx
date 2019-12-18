/**
 *
 * PoolListing
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container, Typography, Button, Table, TableHead, TableCell, TableBody, TableRow, Grid, Chip } from '@material-ui/core';
import { Pool } from 'containers/App';
import { forwardTo } from 'utils/history';

const styles = ({palette}: Theme) =>
  createStyles({
    pageHeader: {
      justifyContent: 'space-between',
    },
    tableHeader: {
      backgroundColor: 'lightgrey',
      borderTop: `${palette.primary.main} 2px solid`,
    },
    poolRow: {
      cursor: 'pointer'
    }
  });

interface OwnProps extends WithStyles<typeof styles> {
  pools: Array<Pool>,
}

const PoolListing: React.FunctionComponent<OwnProps> = ({ pools, classes }: OwnProps) => (
  <Container maxWidth='lg'>
    <Grid container direction='row' className={classes.pageHeader}>
      <Typography variant='h3'>Pool Overview</Typography>
      <Button onClick={() => forwardTo('/admin/pool/create')}>Create New Pool</Button>
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
          <TableRow key={p.address} onClick={() => forwardTo(`/admin/pool/${p.address}`)} className={classes.poolRow}>
            <TableCell>{p.name}</TableCell>
            <TableCell>{p.type}</TableCell>
            <TableCell><Chip label={`${p.period} months`}/></TableCell>
            <TableCell>{p.balance}</TableCell>
            <TableCell>{p.participants}</TableCell>
            <TableCell>{`${((p.interestRate || 0) * 100).toFixed(2)} %`}</TableCell>
          </TableRow>))}
      </TableBody>
    </Table>
  </Container>
);

export default withStyles(styles, { withTheme: true })(PoolListing);
