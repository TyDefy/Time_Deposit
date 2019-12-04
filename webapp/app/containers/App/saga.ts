import { getContext, put, call, take, fork, spawn } from "redux-saga/effects";
import { BlockchainContext } from "blockchainContext";
import { connectMetamask, setWeb3, setStorageValue } from "./actions";
import { getType } from "typesafe-actions";
import { BigNumber } from "ethers/utils";
import { eventChannel } from "redux-saga";

function* simpleStorageContractSaga() {
  const { simpleStorageContract }: BlockchainContext = yield getContext('blockchain');

  try {
    const value: BigNumber = yield call(simpleStorageContract.get);
    yield put(setStorageValue(value.toNumber()));
  } catch (error) {
    console.log('something went wrong', error);
  }
}

function accountChangedEventChannel() {
  return eventChannel(emit => {
    const { ethereum } = window as any;
    const accountChangedHandler = (accounts) => emit(accounts);
    ethereum.on('accountsChanged', accountChangedHandler);
    return () => {
      ethereum.off('accountsChanged', accountChangedHandler);
    };
  });
}

function chainChangedEventChannel() {
  return eventChannel(emit => {
    const { ethereum } = window as any;
    const chainChangedHandler = (chainId) => emit(chainId);
    ethereum.on('networkChanged', chainChangedHandler);
    
    return () => {
      ethereum.off('networkChanged', chainChangedHandler);
    };
  })
}

function* chainChangeListener() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');
  const chainChangedChannel = yield call(chainChangedEventChannel)
  while (true) {
    console.log('waiting for chain change');
    yield take(chainChangedChannel);
    console.log('chain change');

    const result: BlockchainContext = yield call(blockchainContext.enableEthereum);
    yield put(connectMetamask.success({
      ethAddress: result.ethAddress || '0x',
      approvedNetwork: result.approvedNetwork,
      networkName: result.networkName,
      chainId: result.chainId ?? -1,
    }));
  }
}

function* addressChangeListener() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');

  const accountChangedChannel = yield call(accountChangedEventChannel)

  while (true) {
    console.log('waiting for address change');
    yield take(accountChangedChannel);
    console.log('address change');
    const result: BlockchainContext = yield call(blockchainContext.enableEthereum);
    yield put(connectMetamask.success({
      ethAddress: result.ethAddress || '0x',
      approvedNetwork: result.approvedNetwork,
      networkName: result.networkName,
      chainId: result.chainId ?? -1,
    }));
  }
}

function* initialiseWallet() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');
  const result: BlockchainContext = yield call(blockchainContext.enableEthereum);
  yield put(connectMetamask.success({
    ethAddress: result.ethAddress || '0x',
    approvedNetwork: result.approvedNetwork,
    networkName: result.networkName,
    chainId: result.chainId ?? -1,
  }));
}

function* connectMetamaskSaga() {
  yield take(getType(connectMetamask.request));
  try {
    yield call(initialiseWallet);
  } catch (error) {
    console.log(error);
    yield put(connectMetamask.failure(error.message));
  }
}

function* blockchain() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');
  yield put(setWeb3({
    approvedChainId: blockchainContext.approvedChainId,
    approvedNetworkName: blockchainContext.approvedNetworkName,
    isMetamaskInstalled: blockchainContext.isMetamaskInstalled,
  }));

  yield spawn(simpleStorageContractSaga);

  while (blockchainContext.isMetamaskInstalled) {
    yield call(connectMetamaskSaga);
    yield spawn(addressChangeListener);
    yield spawn(chainChangeListener);
  }
}

export default function* root() {
  yield fork(blockchain);
}