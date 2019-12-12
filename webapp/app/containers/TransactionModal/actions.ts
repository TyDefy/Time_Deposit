/*
 *
 * TransactionModal actions
 *
 */

import { createStandardAction } from 'typesafe-actions';

export const setModalOpen = createStandardAction('@TX_MODAL/SET_OPEN')<boolean>();
