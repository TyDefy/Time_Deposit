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
  allPoolsBalance: number,
}

const Dashboard: React.FunctionComponent<OwnProps> = ({pools, allPoolsBalance}: OwnProps) => (
  <Container>
    <HomeHeader allPoolsBalance={allPoolsBalance} />
    <br></br>
    <br></br>
    <br></br>
    <PoolCardList pools={pools} listLabel='AvailablePools' />
  </Container>
);

export default withStyles(styles, { withTheme: true })(Dashboard);
