/**
 *
 * AdminPoolsOverviewPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import PoolListing from 'components/PoolListing';
import { Pool } from 'containers/App';
import selectAdminPoolsOverview from './selectors';

interface OwnProps { }

export interface StateProps {
  pools: Array<Pool>;
}

interface DispatchProps { }

type Props = DispatchProps & StateProps & OwnProps;

// This will come from redux via a selector when contracts are ready

const AdminPoolsOverviewPage: React.FunctionComponent<Props> = (
  {pools}: Props,
) => {
  return <PoolListing pools={pools}/>
};

const mapStateToProps = state => selectAdminPoolsOverview(state);

const withConnect = connect(
  mapStateToProps,
  null,
);

export default compose(withConnect)(AdminPoolsOverviewPage);
