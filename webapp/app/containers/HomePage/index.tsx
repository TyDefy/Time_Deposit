/**
 *
 * HomePage
 *
 */

import React, { useState } from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';

import selectHomePage from './selectors';
import { setNewStorageValue } from 'containers/App/actions';

interface OwnProps { }

interface DispatchProps {
  setValue(newValue: number): void;
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

const HomePage: React.FunctionComponent<Props> = ({
  chainId,
  networkName = '',
  isMetamaskInstalled,
  ethAddress = '',
  approvedNetwork,
  approvedNetworkName,
  approvedChainId,
  storageValue,
  setValue,
}: Props) => {
  const [newValue, setNewValue] = useState<number>(0);

  if (!isMetamaskInstalled) {
    return <div>Please install metamask</div>
  }
  if (isMetamaskInstalled && !ethAddress) {
    return <div>Click connect above</div>
  }
  return <>
    <div>{`Hi ${ethAddress}`}</div>
    <div>{`You are using ${networkName} network (chainId: ${chainId})`}</div>
    <div>{`The current value is ${storageValue}`}</div>
    {approvedNetwork ?
      <div>
        <input type='number' onChange={(e) => setNewValue(parseInt(e.target.value))} value={newValue} />
        <button onClick={() => setValue(newValue)}>Set value</button>
      </div> : 
      <>
        <div>{`Please select the ${approvedNetworkName} (${approvedChainId}) network in metamask`}</div>
      </>
    }
  </>
};

const mapStateToProps = state => selectHomePage(state);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    setValue: (newValue) => dispatch(setNewStorageValue.request(newValue))
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
