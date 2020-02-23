/**
 *
 * AdminPoolUserDetailsPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';

import { compose, Dispatch } from 'redux';
import { RouteComponentProps } from 'react-router-dom';
import selectAdminPoolUserDetailsPage from './selectors';
import { Pool } from 'containers/App';
import AdminPoolUserDetails from 'components/AdminPoolUserDetails';

interface RouteParams {
  poolAddress: string;
  userAddress: string;
}

export interface OwnProps extends RouteComponentProps<RouteParams>,
  React.Props<RouteParams> { }

export interface StateProps {
  pool: Pool,
}

interface DispatchProps { }

type Props = StateProps & DispatchProps & OwnProps;

const AdminPoolUserDetailsPage: React.FC<Props> = ({pool, match}: Props) => (
  <AdminPoolUserDetails {...pool} userAddress={match.params.userAddress} />
);

const mapStateToProps = (state, props) => selectAdminPoolUserDetailsPage(state, props);

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

export default compose(withConnect)(AdminPoolUserDetailsPage);
