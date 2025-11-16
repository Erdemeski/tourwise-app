import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './user/userSlice.js';
import themeReducer from './theme/themeSlice.js';
import languageReducer from './page_Language/languageSlice.js';
import currencyReducer from './currency/currencySlice.js';

const rootReducer = combineReducers({
    user: userReducer,
    theme: themeReducer,
    language: languageReducer,
    currency: currencyReducer,
});

const persistConfig = {
    key: 'root',
    storage,
    vervion: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);