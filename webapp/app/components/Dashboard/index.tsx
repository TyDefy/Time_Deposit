/**
 *
 * Dashboard
 *
 */

import React from 'react';
import { Theme, createStyles, withStyles, WithStyles, Container } from '@material-ui/core';
import HomeHeader from 'components/HomeHeader';
import PoolCardList from 'components/PoolCardList';
import { Pool } from 'containers/App';

const styles = (theme: Theme) =>
  createStyles({
    // JSS in CSS goes here
  });

interface OwnProps extends WithStyles<typeof styles> {
  pools: Array<Pool>,
  poolsBalance: number,
}

const Dashboard: React.FunctionComponent<OwnProps> = ({pools, poolsBalance}: OwnProps) => (
  <Container maxWidth='lg'>
    <HomeHeader poolsBalance={poolsBalance} />
    <br />
    <br />
    <br />
    <PoolCardList pools={pools} listLabel='AvailablePools' />
  </Container>
);

export default withStyles(styles, { withTheme: true })(Dashboard);
