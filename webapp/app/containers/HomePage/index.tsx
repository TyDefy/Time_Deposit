/**
 *
 * HomePage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';

import { Button } from '@material-ui/core';
import selectHomePage from './selectors';

interface OwnProps {}

interface DispatchProps {
}

export interface StateProps {
  isMetamaskInstalled: boolean;
  ethAddress?: string;
  storageValue?: number;
  approvedChainId: number,
  approvedNetworkName: string,
  approvedNetwork: boolean,
  networkName?: string,
  chainId?: number,
}

type Props = StateProps & DispatchProps & OwnProps;

const HomePage: React.FunctionComponent<Props> = (props: Props) => {
  if (!props.isMetamaskInstalled) { 
    return <div>Please install metamask</div> 
  }
  if (props.isMetamaskInstalled && !props.ethAddress) {
    return <div>Click connect above</div>
  }
  return <>
    <div>{`Hi ${props.ethAddress}`}</div>
    <div>{`You are using ${props.networkName} (${props.chainId})`}</div>
    {props.approvedNetwork ?  
      <div>
        <input type='number' />
        <button>Set value</button>
      </div>: 
      <div>{`Please select the ${props.approvedNetworkName} (${props.approvedChainId}) network in metamask`}</div>
    }
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
