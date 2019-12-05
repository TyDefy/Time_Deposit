/**
 *
 * HomePage
 *
 */

import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';


import { Button, Container, Typography, Paper } from '@material-ui/core';
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
    <Container>
      <Fragment>
        <Typography variant="h2">
          WELCOME TO TIME DEPOSIT
        </Typography>
        <br></br>
        <Typography variant="h1">
          $50,000.54
        </Typography>
        <Typography variant="subtitle1">
          Currently contributed to pools
        </Typography>
        <Typography variant="h5">
          Slogan
        </Typography>
        <Typography variant="body1">
        Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. 
        </Typography>
      </Fragment>
      <br></br>
      <br></br>
      <br></br>
      <Paper elevation={1}>
      <Typography variant="h5">
          Available Pools
        </Typography>
      </Paper>
    </Container>
    {/* <div>{`Hi ${props.ethAddress}`}</div>
    <div>{`You are using ${props.networkName} (${props.chainId})`}</div>
    {props.approvedNetwork ?  
      <div>
        <input type='number' />
        <button>Set value</button>
      </div>: 
      <div>{`Please select the ${props.approvedNetworkName} (${props.approvedChainId}) network in metamask`}</div> */}
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
