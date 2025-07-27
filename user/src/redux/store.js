import { configureStore } from '@reduxjs/toolkit'
import user from './reducers/user';
import chalet from './reducers/chalet';
import resort from './reducers/resort';
import hall from './reducers/hall';
import bank from './reducers/bank';

export const store = configureStore({
  reducer: {
    user,
    chalet,
    resort,
    hall,
    bank
  },
})