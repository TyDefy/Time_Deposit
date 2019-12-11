/**
 *
 * PoolDetailsPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import { compose, Dispatch } from 'redux';

import selectPoolDetailsPage from './selectors';
import PoolDetails from 'components/PoolDetails';
import { Pool } from 'containers/App';

interface OwnProps {}

interface DispatchProps {}

export interface StateProps {
  // pool: UserPoolDetails,
}

export interface Transaction {
  address: string;
  time: Date;
  type: 'Contribute' | 'Withdraw';
  amount: number;
}

export interface UserPoolDetails extends Pool {
  contribution: number;
  interestAccrued: number;
  availableInterest: number;
  transactions: Array<Transaction>;
}

const pool: UserPoolDetails = {
    address: '0x1',
    name: 'Test',
    period: 3,
    interestRate: 0.07,
    type: 'cDAI',
    balance: 900,
    participants: 5,
    availableInterest: 0,
    interestAccrued: 10,
    contribution: 50,
    transactions: [
      { address: '0x2', time: new Date(), type: 'Contribute', amount: 1 },
      { address: '0x3', time: new Date(), type: 'Contribute', amount: 1 },
      { address: '0x4', time: new Date(), type: 'Contribute', amount: 1 },
      { address: '0x5', time: new Date(), type: 'Contribute', amount: 1 },
      { address: '0x6', time: new Date(), type: 'Contribute', amount: 1 },
    ]
  }

type Props = StateProps & DispatchProps & OwnProps;

const PoolDetailsPage: React.FunctionComponent<Props> = (props: Props) => {
  return <PoolDetails {...pool}/>;
};

const mapStateToProps = state => selectPoolDetailsPage(state);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    dispatch: dispatch,
  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
)(PoolDetailsPage);