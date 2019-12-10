/**
 *
 * HomePage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';


import {  Container } from '@material-ui/core';
import selectHomePage from './selectors';
import HomeHeader from 'components/HomeHeader';
import PoolCardList from 'components/PoolCardList';
import { Pool } from 'containers/App';

interface OwnProps { }

interface DispatchProps {
}

export interface StateProps {
}

type Props = StateProps & DispatchProps & OwnProps;

const pools: Array<Pool> = [
  { address: '0x1', name: 'Test 1', type: 'cDAI', period: 1, balance: 500, participants: 100, interestRate: 0.035 },
  { address: '0x2', name: 'Test 2', type: 'cDAI', period: 2, balance: 1000, participants: 200, interestRate: 0.07 },
  { address: '0x3', name: 'Test 3', type: 'cDAI', period: 3, balance: 2000, participants: 500, interestRate: 0.105 },
]

const HomePage: React.FunctionComponent<Props> = ({}: Props) => {
  return <>
    <Container>
     <HomeHeader runningTotal="50,000.43"></HomeHeader>
     <br></br>
     <br></br>
     <br></br>
    </Container>
    <PoolCardList pools={pools} />
  </>
};

const mapStateToProps = state => selectHomePage(state);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {

  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

// Remember to add the key to ./app/types/index.d.ts ApplicationRootState
// <OwnProps> restricts access to the HOC's other props. This component must not do anything with reducer hoc


export default compose(
  withConnect,
)(HomePage);
