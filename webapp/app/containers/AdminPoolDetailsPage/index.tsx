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

export interface StateProps {
  pool: PoolDetails,
}

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

const AdminPoolDetailsPage: React.FunctionComponent<Props> = ({pool}: Props) => {
  return <AdminPoolDetails {...pool} />
};

const mapStateToProps = (state, props) => selectAdminPoolDetailsPage(state, props);

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
