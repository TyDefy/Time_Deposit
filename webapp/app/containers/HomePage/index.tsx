/**
 *
 * HomePage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';


import selectHomePage from './selectors';
import { Pool } from 'containers/App';
import Dashboard from 'components/Dashboard';

interface OwnProps { }

interface DispatchProps {
}

export interface StateProps {
  pools: Array<Pool>,
  poolsBalance: number
}

type Props = StateProps & DispatchProps & OwnProps;

const HomePage: React.FunctionComponent<Props> = ({ pools, poolsBalance}: Props) => (
  <Dashboard pools={pools} poolsBalance={poolsBalance}/>
);

const mapStateToProps = state => selectHomePage(state);

const withConnect = connect(
  mapStateToProps,
  null,
);

// Remember to add the key to ./app/types/index.d.ts ApplicationRootState
// <OwnProps> restricts access to the HOC's other props. This component must not do anything with reducer hoc


export default compose(
  withConnect,
)(HomePage);
