/**
 *
 * AdminPoolDetailsPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';

import selectAdminPoolDetailsPage from './selectors';
import AdminPoolDetails from 'components/AdminPoolDetails';
import { Pool } from 'containers/App';

interface OwnProps {}

interface DispatchProps {}

export interface StateProps {}

export interface PoolParticipant {
  address: string;
  joined: Date;
  contributed: number;
  interest: number;
}

export interface PoolDetails extends Pool {
  totalInterest: number;
  feeRate: number;
  pentalyRate: number;
  participantDetails: Array<PoolParticipant>;
}

type Props = StateProps & DispatchProps & OwnProps;

const poolDetails: PoolDetails = {
  address: '0x1',
  name: 'Test',
  period: 3,
  interestRate: 0.07,
  type: 'cDAI',
  balance: 900,
  feeRate: 0.01,
  pentalyRate: 0.01,
  totalInterest: 10,
  participants: 5,
  participantDetails: [
    { address: '0x2', joined: new Date(), contributed: 10, interest: 1 },
    { address: '0x3', joined: new Date(), contributed: 10, interest: 1 },
    { address: '0x4', joined: new Date(), contributed: 10, interest: 1 },
    { address: '0x5', joined: new Date(), contributed: 10, interest: 1 },
    { address: '0x6', joined: new Date(), contributed: 10, interest: 1 },
  ]
}

const AdminPoolDetailsPage: React.FunctionComponent<Props> = (props: Props) => {
  return <AdminPoolDetails {...poolDetails} />
};

const mapStateToProps = (state) => selectAdminPoolDetailsPage(state);

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
)(AdminPoolDetailsPage);
