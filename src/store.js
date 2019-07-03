import { createStore, combineReducers } from 'redux';

const initialState = {
    loading: false
}
function commonReducer(state=initialState, action) {
    switch(action.type) {
        case 'LOADING': {
            const newState = Object.assign({}, state, { loading: action.data })
            return newState;
        }
        default: return state;
    }
}

const reducers = combineReducers({ common: commonReducer });

const store = createStore(reducers);

export default store;



