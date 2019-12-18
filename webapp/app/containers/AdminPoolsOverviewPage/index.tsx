/**
 *
 * AdminPoolsOverviewPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import PoolListing from 'components/PoolListing';
import { Pool } from 'containers/App';
import selectAdminPoolsOverview from './selectors';

interface OwnProps { }

export interface StateProps {
  pools: Array<Pool>;
}

interface DispatchProps { }

type Props = DispatchProps & StateProps & OwnProps;

// This will come from redux via a selector when contracts are ready
const pools: Array<Pool> = [
  { address: '0x1', withdraw:'0xWithdraw', name: 'Test 1', description: 'test description',type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035 },
  { address: '0x2', withdraw:'0xWithdraw', name: 'Test 2', description: 'test description',type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07 },
  { address: '0x3', withdraw:'0xWithdraw', name: 'Test 3', description: 'test description',type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105 },
]

const AdminPoolsOverviewPage: React.FunctionComponent<Props> = (
  props: Props,
) => {
  return <PoolListing pools={pools}/>
};

const mapStateToProps = state => selectAdminPoolsOverview(state);

const withConnect = connect(
  mapStateToProps,
  null,
);

export default compose(withConnect)(AdminPoolsOverviewPage);
