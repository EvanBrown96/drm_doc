import { useReducer, createContext, useContext, useEffect } from 'react';
import { useDb } from './db';
import { useCubelib } from './cubelib_loader';
import type { Case } from './db';
import Cube from 'cubejs';

let AppStateContext = createContext(null);
let AppDispatchContext = createContext(null);
let TrainingDataContext = createContext(null);

function AppContextProvider({ children }) {

    
    let {loaded: dbLoaded, getCases} = useDb();
    let {loaded: cubeLibLoaded} = useCubelib();

    useEffect(() => {
        if(!dbLoaded) return;
        if(!cubeLibLoaded) return;
        dispatch({type: 'finished_init'});
        return () => dispatch({type: 'reset'})
    }, [dbLoaded, cubeLibLoaded]);

    const [state, dispatch] = useReducer(stateReducer, initialAppState());

    if(state.state[0] == 'options' && state.state[1] == 'loading_data'){
        let training_data = getCases(state.training_parameters.max_length, state.training_parameters.max_trigger, state.training_parameters.min_trigger);
        dispatch({type: "data_loaded", data: training_data});
    }   

    return (
        <AppStateContext value={state}>
            <AppDispatchContext value={dispatch}>
                {children}
            </AppDispatchContext>
        </AppStateContext>
    );
}


function initialAppState(): AppState {
    return {
        training_parameters: {
            drm: "4c4e",
            max_length: 5,
            max_trigger: 4,
            min_trigger: 1,
            max_display: 6
        },
        state: ['setup', 'initializing']
    }
}

type AppStateValue = ['setup', 'initializing'] | ['options', 'options' | 'loading_data'] | ['training', 'idle' | 'training' | 'showing_solution']

type AppState = { 
    training_parameters: TrainingParameters,
    state: AppStateValue,
    current_training?: {case: Case, setup: string},
    training_cases?: Case[]
};

export type TrainingParameters = {
    drm: string,
    max_length: number,
    max_trigger: number,
    min_trigger: number,
    max_display: number
};

type AppStateAction =
  { type: 'finished_init' }
| { type: 'set_training_params', settings: Partial<TrainingParameters> }
| { type: 'reset' }
| { type: 'data_loaded', data: Case[] }
| { type: 'set_training_case', case: Case, setup: string }
| { type: 'start_training' }
| { type: 'see_solutions' }
| { type: 'change_options' };

function stateReducer(app_state: AppState, action: AppStateAction): AppState {
    switch(app_state.state[0]) {
        case 'setup':
            switch(action.type) {
                case 'finished_init':
                    return {
                        ...app_state,  
                        state: ['options', 'options']
                    }
                case 'reset':
                    return initialAppState();
            }
            throw Error("invalid app state");
        case 'options':
            switch(action.type) {
                case 'set_training_params':
                    return {
                        ...app_state,
                        state: ['options', 'options'],
                        training_parameters: {
                            ...app_state.training_parameters,
                            ...action.settings
                        }
                    }
                case 'start_training':
                    return {
                        ...app_state,
                        state: ['options', 'loading_data']
                    }
                case 'data_loaded':
                    return {
                        ...app_state,
                        state: ['training', 'idle'],
                        training_cases: action.data,
                        current_training: undefined
                    }
            }
            throw Error("invalid app state");
        case 'training':
            switch(action.type) {
                case 'set_training_case':
                    console.log("training case set")
                    return {
                        ...app_state,
                        state: ['training', 'training'],
                        current_training: {case: action.case, setup: action.setup}
                    }
                case 'see_solutions':
                    return {
                        ...app_state,
                        state: ['training', 'showing_solution']
                    }
                case 'change_options':
                    return {
                        ...app_state,
                        state: ['options', 'options']
                    }
            };
            throw Error("invalid app state")
    }
}


function useAppStateFull(): AppState {
    return useContext(AppStateContext);
}

function useTrainingParams(): TrainingParameters {
    return useAppStateFull().training_parameters;
}

function useAppState(): AppStateValue {
    console.log(AppStateContext);
    return useAppStateFull().state;
}

function useAppDispatch () {
    return useContext(AppDispatchContext);
}


function useDispatchRandomCase(): () => undefined {
    let app_state = useAppStateFull();
    let dispatch = useAppDispatch();
    return () => {
        if(app_state.state[0] == "setup")
            throw new Error("data not initialized");
        let rand_case = app_state.training_cases[Math.floor(Math.random()*app_state.training_cases.length)];
        let scramble = rand_case.solutions[0].solution + " " + randomDrState();
        const cube = new Cube();
        cube.move(scramble)
        let solution = cube.solve()
        dispatch({type: 'set_training_case',
            case: rand_case,
            setup: solution
          })
    }
}

function randomDrState() {
    // too lazy to implement proper scrambler so random moves yay
    let qt = ["U", "U'", "D", "D'"]
    let ht = ["F2", "B2", "R2", "L2"]
    let moves = []
    for(let i = 0; i < 250; i++) {
        moves.push(qt[Math.floor(Math.random()*qt.length)]);
        moves.push(ht[Math.floor(Math.random()*ht.length)]);
    }
    return moves.join(" ")
}

function invert(scramble) {
    let moves = scramble.split(" ").reverse()
    let moves_out = []
    for(let m of moves) {
        if(m[-1] == "2") moves_out.push(m);
        else if(m[-1] == "'") moves_out.push(m[0]);
        else moves_out.push(m + "'")
    }
    return moves_out.join(" ")
}

function useCurrentTraining(): null | {case: Case, setup: string} {
    let app_state = useAppStateFull();
    if(app_state.state[0] != "training" || app_state.state[1] == "idle") return null;
    return app_state.current_training;
}

export { AppContextProvider, useAppStateFull, useTrainingParams, useAppState, useAppDispatch, useDispatchRandomCase, useCurrentTraining };
