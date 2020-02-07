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
import { withdrawFees } from 'containers/App/actions';
import { RouteComponentProps } from 'react-router-dom';

interface RouteParams {
  poolAddress: string;
}

export interface OwnProps extends RouteComponentProps<RouteParams>,
  React.Props<RouteParams> { }

interface DispatchProps {
  terminatePool(): void;
}

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
  participantDetails: Array<PoolParticipant>;
}

type Props = StateProps & DispatchProps & OwnProps;

const AdminPoolDetailsPage: React.FunctionComponent<Props> = ({pool, terminatePool}: Props) => {
  return <AdminPoolDetails {...pool} terminatePool={terminatePool} />
};

const mapStateToProps = (state, props) => selectAdminPoolDetailsPage(state, props);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    terminatePool: () => dispatch(withdrawFees.request({poolAddress: ownProps.match.params.poolAddress})),
  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withConnect,
)(AdminPoolDetailsPage);
