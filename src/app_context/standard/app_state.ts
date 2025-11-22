import type { Case } from '../../types/types';
import { gen_setup } from "../../cube_functions";
import { GenericState, AppState } from '../common_app_state';


export interface StandardTrainerState extends GenericState {
    state: 'training',
    substate: 'idle' | 'getting_case' | 'training' | 'showing_solution' | 'invalid_settings',
    training_parameters: StandardTrainingParameters,
    current_training?: {case: Case, setup: string},
    queue: {
        time_since_queue: number,
        queued: Case[]
    }
}

export type StandardTrainerAction =
| { type: 'set_training_params', settings: Partial<StandardTrainingParameters> }
| { type: 'set_training_case', case: Case }
| { type: 'see_solutions' }
| { type: 'queue_case' }
| { type: 'invalid_settings' }
| { type: 'new_case' };

export type StandardTrainingParameters = {
    drm: string,
    max_length: number,
    max_trigger: number,
    min_trigger: number,
    eo_breaking: boolean
};

const DEFAULT_TRAINING: StandardTrainingParameters =
{
    drm: "4c4e",
    max_length: 5,
    max_trigger: 4,
    min_trigger: 1,
    eo_breaking: false
};

function updateTrainingParams(current_params: StandardTrainingParameters, update: Partial<StandardTrainingParameters>) {
    return {
        ...current_params,
        ...update
    }
}

const StandardTrainer = {
    IdleState: (previous_state: AppState, training_params: StandardTrainingParameters): StandardTrainerState => {
        return {...previous_state, state: 'training', substate: 'idle', training_parameters: training_params, 
                current_training: null, queue: {queued: [], time_since_queue: 0}}
    },

    GettingCaseState: (previous_state: StandardTrainerState, queue?: {
        time_since_queue: number,
        queued: Case[]
    }): StandardTrainerState => {
        if(!queue) queue = previous_state.queue;
        return {...previous_state, substate: 'getting_case', queue}
    },

    TrainingState: (previous_state: StandardTrainerState, new_case: Case, queue?: {
        time_since_queue: number,
        queued: Case[]
    }): StandardTrainerState => {
        if(!queue) queue = previous_state.queue;
        return {
            ...previous_state,
            substate: 'training',
            current_training: {case: new_case, setup: gen_setup(new_case)},
            queue
        };
    },

    SolutionsState: (previous_state: StandardTrainerState): StandardTrainerState => {
        return {
            ...previous_state,
            substate: 'showing_solution'
        }
    },

    InvalidSettingsState: (previous_state: StandardTrainerState): StandardTrainerState => {
        return {
            ...previous_state,
            substate: 'invalid_settings'
        }
    },

    getTrainingParams: (app_state: StandardTrainerState): StandardTrainingParameters => {
        return app_state.training_parameters;
    },

    getAppSubState: (app_state: StandardTrainerState): StandardTrainerState["substate"] => {
        return app_state.substate;
    },

    getCurrentTraining: (app_state: StandardTrainerState): null | {case: Case, setup: string} => {
        if(!['training', 'showing_solution'].includes(app_state.substate)) return null;
        return app_state.current_training;
    }
}


export { StandardTrainer, updateTrainingParams, DEFAULT_TRAINING };