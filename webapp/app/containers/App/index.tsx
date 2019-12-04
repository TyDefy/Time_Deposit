/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 * NOTE: while this component should technically be a stateless functional
 * component (SFC), hot reloading does not currently support SFCs. If hot
 * reloading is not a necessity for you then you can refactor it and remove
 * the linting exception.
 */

import React from 'react';
import { connect } from 'react-redux';
import { Switch, withRouter, RouteComponentProps } from 'react-router';
import { compose, Dispatch } from 'redux';
import { Redirect, Route } from 'react-router-dom';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { DAEMON } from 'utils/constants';
import saga from './saga';
import reducer from './reducer';

import selectApp from './selectors';

import AppWrapper from '../../components/AppWrapper/index';
import Notifier from '../Notification/notifier';
import HomePage from 'containers/HomePage';
import { connectMetamask } from './actions';
import AdminPoolsOverviewPage from 'containers/AdminPoolsOverviewPage';

interface OwnProps {
  isMetamaskInstalled: boolean,
  ethAddress?: string,
}

export interface StateProps {

}

export interface DispatchProps {
  connect(): void;
}

export interface Pool {
  address: string;
  name: string;
  type: string;
  period: number;
  cap: number;
  participants: number;
  interestRate: number;
}

type Props = StateProps & DispatchProps & OwnProps & RouteComponentProps;

const NotFoundRedirect = () => <Redirect to='/404' />
// const RoleRoute: React.FunctionComponent<any> = ({ component: Component, isAuthorized, ...rest }) => (
//   <Route
//     {...rest}
//     render={props => (
//       isAuthorized ? (
//         <Component {...props} />
//       ) : (
//           <Redirect
//             to={{
//               pathname: '/unauthorized',
//               state: { from: props.location },
//             }}
//           />
//         )
//     )
//     }
//   />
// );

// Keep most specific routes

const App: React.FunctionComponent<Props> = (props: Props) => {
  return (
    <>
      <Notifier />
      <AppWrapper {...props}>
        <Switch>
          <Route exact path='/admin/pools' component={AdminPoolsOverviewPage} />
          <Route exact path='/' component={HomePage} />
          <Route component={NotFoundRedirect} />
        </Switch>
      </AppWrapper>
    </>
  );
};

const mapStateToProps = state => selectApp(state);

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  connect: () => dispatch(connectMetamask.request()),
});

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

const withReducer = injectReducer<OwnProps>({ key: 'app', reducer: reducer });
const withSaga = injectSaga<OwnProps>({ key: 'app', saga: saga, mode: DAEMON });


export default compose(
  withRouter,
  withReducer,
  withSaga,
  withConnect,
)(App);