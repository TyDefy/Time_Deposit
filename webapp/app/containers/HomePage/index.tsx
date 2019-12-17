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
  pools: Array<Pool>,
  poolsBalance: number,
}

type Props = StateProps & DispatchProps & OwnProps;

const pools: Array<Pool> = [
  { address: '0x1', withdraw:'0xWithdraw',name: 'Test 1', description:'test description', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035 },
  { address: '0x2', withdraw:'0xWithdraw',name: 'Test 2', description:'test description', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07 },
  { address: '0x3', withdraw:'0xWithdraw',name: 'Test 3', description:'test description', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105 },
  { address: '0x4', withdraw:'0xWithdraw',name: 'Test 1', description:'test description', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035 },
  { address: '0x5', withdraw:'0xWithdraw',name: 'Test 2', description:'test description', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07 },
  { address: '0x6', withdraw:'0xWithdraw',name: 'Test 3', description:'test description', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105 },
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
