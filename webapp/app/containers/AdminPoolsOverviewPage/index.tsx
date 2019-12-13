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
  { address: '0x1', name: 'Test 1', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x2', name: 'Test 2', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x3', name: 'Test 3', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x4', name: 'Test 1', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x5', name: 'Test 2', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x6', name: 'Test 3', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
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
