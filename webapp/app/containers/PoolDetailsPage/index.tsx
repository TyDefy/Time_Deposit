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

interface OwnProps {}

interface DispatchProps {}

export interface StateProps {}

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
