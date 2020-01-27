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
  interestRate: number,
  exchangeRate: number
}

const Dashboard: React.FunctionComponent<OwnProps> = ({pools, poolsBalance, interestRate, exchangeRate}: OwnProps) => (
  <Container maxWidth='lg'>
    <HomeHeader poolsBalance={poolsBalance} />
    <br />
    <br />
    <br />
    <PoolCardList interestRate={interestRate} exchangeRate={exchangeRate} pools={pools} listLabel='AvailablePools' />
  </Container>
);

export default withStyles(styles, { withTheme: true })(Dashboard);
