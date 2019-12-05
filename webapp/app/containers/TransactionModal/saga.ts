import { takeLatest, take, race, put } from "redux-saga/effects";
import { setModalOpen } from "./actions";

export function* txSaga(action) {
  yield put(setModalOpen(true));
  yield race({
    success: take(action.type.replace('_REQUEST', '_SUCCESS')),
    failure: take(action.type.replace('_REQUEST', '_FAILURE'))
  })
  yield put(setModalOpen(false));
}

export default function* transactionModalWatcherSaga() {
  yield takeLatest(action => (action.type.startsWith('@TX_REQUEST/')), txSaga);
}
