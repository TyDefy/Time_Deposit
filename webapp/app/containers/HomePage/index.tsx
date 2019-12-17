/**
 *
 * HomePage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';


import selectHomePage from './selectors';
import { Pool } from 'containers/App';
import Dashboard from 'components/Dashboard';

interface OwnProps { }

interface DispatchProps {
}

export interface StateProps {
  // pools: Array<Pool>,
  // poolsBalance: number,
}

type Props = StateProps & DispatchProps & OwnProps;

const pools: Array<Pool> = [
  { address: '0x1', name: 'Test 1', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x2', name: 'Test 2', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x3', name: 'Test 3', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x4', name: 'Test 1', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x5', name: 'Test 2', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
  { address: '0x6', name: 'Test 3', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105, description: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies" },
]

const allPoolsBalance = 50000.43;

const HomePage: React.FunctionComponent<Props> = ({ }: Props) => (
  <Dashboard pools={pools} allPoolsBalance={allPoolsBalance} />
);

const mapStateToProps = state => selectHomePage(state);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {

  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

// Remember to add the key to ./app/types/index.d.ts ApplicationRootState
// <OwnProps> restricts access to the HOC's other props. This component must not do anything with reducer hoc


export default compose(
  withConnect,
)(HomePage);
