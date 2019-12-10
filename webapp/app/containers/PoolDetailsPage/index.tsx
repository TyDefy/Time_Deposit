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

export interface StateProps {}

export interface Transaction {
  address: string;
  time: Date;
  type: 'Contribute' |'Withdraw';
  amount: number;
}

export interface UserPoolDetails extends Pool {
  totalInterest: number;
  transactions: Array<Transaction>;
}

type Props = StateProps & DispatchProps & OwnProps;

const PoolDetailsPage: React.FunctionComponent<Props> = (props: Props) => {
  return <PoolDetails />;
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
