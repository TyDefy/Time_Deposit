import { getContext, put, call, take, fork, race } from "redux-saga/effects";
import { BlockchainContext } from "blockchainContext";
import { connectMetamask, setWeb3 } from "./actions";
import { getType } from "typesafe-actions";

function* connectMetamaskHandler() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');
  try {
    const result: BlockchainContext = yield call(blockchainContext.enableEthereum);
    yield put(connectMetamask.success({
      ethAddress: result.ethAddress || '0x'
    }));
  } catch (error) {
    yield put(connectMetamask.failure(error.message));  
  }
}

function* blockchain() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');
  yield put(setWeb3(blockchainContext.isWeb3Enabled));
  while (blockchainContext.isWeb3Enabled) {
    yield take(getType(connectMetamask.request));
    yield fork(connectMetamaskHandler);
    // const result = yield race({
    //   success: take(connectMetamask.success),
    //   failure: take(connectMetamask.failure)
    // })
    
  }
}

export default function * root() {
  yield fork(blockchain);
}