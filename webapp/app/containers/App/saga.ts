import { getContext, takeEvery, put, call } from "redux-saga/effects";
import { BlockchainContext } from "blockchainContext";
import { connectMetamask } from "./actions";
import { getType } from "typesafe-actions";

function* blockchain() {
  const blockchainContext: BlockchainContext = yield getContext('blockchain');
  try {
    const result: BlockchainContext = yield call(blockchainContext.enableEthereum);
    console.log(result);
  } catch (error) {
    console.log(error);
    yield put(connectMetamask.failure(error.message));  
  }
}

export default function * root() {
  yield takeEvery(getType(connectMetamask.request), blockchain);
}