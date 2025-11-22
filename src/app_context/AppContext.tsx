import { useReducer, createContext, useContext, useEffect } from 'react';
import { useCubelib } from '../cubelib_loader';
import type { Case } from '../types/types';
import { AppState, AppStateAction, setupState } from './common_app_state';
import { DiscardTrainerState, DiscardTrainer, DEFAULT_DISCARD } from './discard/app_state';
import { StandardTrainerState, StandardTrainer, DEFAULT_TRAINING } from './standard/app_state';
import { getItem, setItem } from '../persist';
import { standardStateReducer } from './standard/reducer';
import { discardStateReducer } from './discard/reducer';
import { useDrmService } from '../data_access/drm_data_service';

let AppStateContext = createContext(null);
let AppDispatchContext = createContext(null);

function AppContextProvider({ children }) {

    let drm_service = useDrmService();
    let {loaded: cubeLibLoaded} = useCubelib();

    useEffect(() => {
        if(!cubeLibLoaded) return;
        dispatch({type: 'finished_init'});
        return () => dispatch({type: 'reset'})
    }, [cubeLibLoaded]);

    const [state, dispatch] = useReducer(stateReducer, setupState({timer_enabled: true}));

    useEffect(() => {
        if(state.state == 'training' || state.state == 'discard') {
            if(state.substate != 'getting_case') return;
        }
        

        (async () => {
            let drm;
            let min_trigger;
            let max_trigger;
            let min_length;
            let max_length;
            let eo_breaking;
            if(state.state == 'training') {
                drm = state.training_parameters.drm;
                min_trigger = state.training_parameters.min_trigger;
                max_trigger = state.training_parameters.max_trigger;
                min_length = state.training_parameters.min_trigger;
                max_length = state.training_parameters.max_length;
                eo_breaking = state.training_parameters.eo_breaking;

                try{
                    const new_case = await drm_service.getRandomCase(drm, min_length, max_length, min_trigger, max_trigger, eo_breaking);
                    dispatch({type: "set_training_case", case: new_case})
                }
                catch(e) {
                    dispatch({type: "invalid_settings"});
                }
            }
            else if(state.state == 'discard') {
                
                let choose_good_case = (Math.random() * 100 < state.training_parameters.good_case_ratio);

                drm = state.training_parameters.drm;
                eo_breaking = true;

                if(choose_good_case) {
                    min_trigger = 1;
                    max_trigger = state.training_parameters.max_length;
                    min_length = 0;
                    max_length = state.training_parameters.max_length;
                }
                else {
                    min_length = max_length+1;
                    max_length = Infinity;
                    min_trigger = min_trigger;
                    max_trigger = Infinity;
                }
                
                try{
                    const new_case = await drm_service.getRandomCase(drm, min_length, max_length, min_trigger, max_trigger, eo_breaking);
                    dispatch({type: "set_discard_training_case", case: {...new_case, is_good: choose_good_case}})
                }
                catch(e) {
                    dispatch({type: "invalid_settings"});
                }
            }
        })();

    }, [state]);

    return (
        <AppStateContext value={state}>
            <AppDispatchContext value={dispatch}>
                {children}
            </AppDispatchContext>
        </AppStateContext>
    );
}


function stateReducer(app_state: AppState, action: AppStateAction): AppState {
    switch(app_state.state) {
        case 'setup':
            return setupStateReducer(app_state, action);
        case 'training':
            if(action.type == "switch_trainer") return switchTrainer(app_state, action.trainer);
            return standardStateReducer(app_state, action);
        case 'discard':
            if(action.type == "switch_trainer") return switchTrainer(app_state, action.trainer);
            return discardStateReducer(app_state, action);
    }
}

function setupStateReducer(app_state: AppState, action: AppStateAction): AppState {
    switch(action.type) {
        case 'finished_init':
            const trainer = getItem("active_trainer", "standard");
            return switchTrainer(app_state, trainer);
        case 'reset':
            return setupState(app_state.global_settings);
    }
    throw Error("invalid app state");
}


function switchTrainer(app_state: AppState, new_trainer): AppState {
    if(app_state.state == new_trainer) {
        return app_state;
    }
    else if(new_trainer == "standard") {
        const params = getItem("standard_params", DEFAULT_TRAINING);
        setItem("active_trainer", new_trainer);
        return StandardTrainer.IdleState(app_state, params);
    }
    else if(new_trainer == "discard") {
        const params = getItem("discard_params", DEFAULT_DISCARD);
        setItem("active_trainer", new_trainer);
        return DiscardTrainer.IdleState(app_state, params);
    }
}

function useAppState(): AppState {
    return useContext(AppStateContext);
}

function useAppDispatch () {
    return useContext(AppDispatchContext);
}


function useDispatchNewCase(): () => undefined {
    let dispatch = useAppDispatch();
    return () => {
        dispatch({type: 'new_case'});
    }
}

function useDispatchQueueCase(): () => undefined {
    let dispatch = useAppDispatch();
    return () => {
        dispatch({type: 'queue_case'});
    }
}

function useDispatchResetStats(): () => undefined {
    let dispatch = useAppDispatch();
    return () => {
        dispatch({type: 'reset_stats'});
    }
}

export { AppContextProvider, useAppState, useAppDispatch, useDispatchNewCase, useDispatchQueueCase, useDispatchResetStats };
