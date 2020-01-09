import { getContext, put, call, take, fork } from "redux-saga/effects";
import { BlockchainContext } from "blockchainContext";
import { connectMetamask, setWeb3, setDaiBalance, setIsAdmin } from "./actions";
import { getType } from "typesafe-actions";
import { eventChannel } from "redux-saga";
import { BigNumber, formatEther } from "ethers/utils";
import poolFactorySaga, { deployedUtilySaga } from "./poolFactorySaga";
import poolSaga from "./poolSaga";

export function* daiBalanceListener() {
  const { daiContract, ethAddress = '0x' }: BlockchainContext = yield getContext('blockchain');

  const filterTo = daiContract.filters.Transfer(null, ethAddress, null);
  const filterFrom = daiContract.filters.Transfer(ethAddress, null, null);

  const transferEventChannel = eventChannel(emit => {
    const daiBalanceChangedHandler = (value) => emit(value)
    try {
      daiContract.on(filterTo, daiBalanceChangedHandler);
      daiContract.on(filterFrom, daiBalanceChangedHandler);
    }
    catch (e) {
      console.log(e);
    }
    return () => {
      daiContract.off(filterTo, daiBalanceChangedHandler);
      daiContract.off(filterFrom, daiBalanceChangedHandler);
    };
  });

  while (true) {
    const daiBalance: BigNumber = yield call([daiContract, daiContract.balanceOf], ethAddress);
    yield put(setDaiBalance(parseFloat(formatEther(daiBalance))));
    yield take(transferEventChannel);
  }
}


function* addressChangeListener() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');

  const accountChangedChannel = eventChannel(emit => {
    const { ethereum } = window as any;
    const accountChangedHandler = (accounts) => emit(accounts);
    ethereum.on('accountsChanged', accountChangedHandler);
    const chainChangedHandler = (chainId) => emit(chainId);
    ethereum.on('networkChanged', chainChangedHandler);
    return () => {
      ethereum.off('accountsChanged', accountChangedHandler);
      ethereum.off('networkChanged', chainChangedHandler);
    };
  });

  while (true) {
    if (blockchainContext.approvedNetwork) {
      yield fork(daiBalanceListener);
    }
    yield take(accountChangedChannel);
    const result: BlockchainContext = yield call(blockchainContext.enableEthereum);
    yield put(connectMetamask.success({
      ethAddress: result.ethAddress || '',
      approvedNetwork: result.approvedNetwork,
      networkName: result.networkName,
      chainId: result.chainId ?? 0,
    }));
    yield fork(getUserType);
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

function* getUserType() {
  const { poolRegistryContract, ethAddress = '' }: BlockchainContext = yield getContext('blockchain');
  try {
    const isAdmin = yield call([poolRegistryContract, poolRegistryContract.isWhitelistAdmin], ethAddress);
    yield put(setIsAdmin(isAdmin));
    debugger;
    if (isAdmin) {
      yield fork(deployedUtilySaga);
    }
  } catch (error) {
    console.log(error);
    yield put(setIsAdmin(false));
  }
}

function* blockchain() {
  const { approvedChainId, approvedNetworkName, isMetamaskInstalled }: BlockchainContext = yield getContext('blockchain');
  yield put(setWeb3({
    approvedChainId: approvedChainId,
    approvedNetworkName: approvedNetworkName,
    isMetamaskInstalled: isMetamaskInstalled,
  }));

  while (isMetamaskInstalled) {
    yield call(connectMetamaskSaga);
    yield fork(getUserType);
    yield fork(addressChangeListener);
  }
}

export default function* root() {
  yield fork(blockchain);
  yield fork(poolFactorySaga);
  yield fork(poolSaga);
}