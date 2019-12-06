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

interface OwnProps { }

interface DispatchProps {
}

export interface StateProps {
}

type Props = StateProps & DispatchProps & OwnProps;

const HomePage: React.FunctionComponent<Props> = ({}: Props) => {
  var pool = { address: "0x", name:"",type: "",period: 2,cap: 0, participants:2,interestRate: 2};
  return <>
    <Container>
     <HomeHeader runningTotal="50,000.43"></HomeHeader>
     <br></br>
     <br></br>
     <br></br>
    </Container>
    <PoolCardList pools={[pool,pool,pool]}></PoolCardList>
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
