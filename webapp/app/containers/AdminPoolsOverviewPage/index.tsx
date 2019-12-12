/**
 *
 * AdminPoolsOverviewPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';
import PoolListing from 'components/PoolListing';
import { Pool } from 'containers/App';

interface OwnProps { }

interface StateProps {
}

interface DispatchProps { }

type Props = DispatchProps & StateProps & OwnProps;

// This will come from redux via a selector when contracts are ready
const pools: Array<Pool> = [
  { address: '0x1', name: 'Test 1', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035 },
  { address: '0x2', name: 'Test 2', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07 },
  { address: '0x3', name: 'Test 3', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105 },
]

const AdminPoolsOverviewPage: React.FunctionComponent<Props> = (
  props: Props,
) => {
  return <PoolListing pools={pools} createPool={() => console.log('creating new pool')}/>
};

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    dispatch: dispatch,
  };
};

const withConnect = connect(
  null,
  mapDispatchToProps,
);

export default compose(withConnect)(AdminPoolsOverviewPage);
