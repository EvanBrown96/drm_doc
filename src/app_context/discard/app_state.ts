import type { Case } from '../../types/types';
import { gen_setup } from "../../cube_functions";
import { GenericState, AppState } from '../common_app_state';
import { getItem } from '../../persist';

export type DiscardMetadataCase = Case & {is_good: boolean};

export interface DiscardTrainerState extends GenericState {
    state: 'discard',
    substate: 'idle' | 'getting_case' | 'training' | 'correct_choice' | 'incorrect_choice' | 'invalid_settings',
    training_parameters: DiscardTrainingParameters,
    current_training?: {case: DiscardMetadataCase, setup: string },
    queue: {
        time_since_queue: number,
        queued: DiscardMetadataCase[]
    },
    statistics?: {
        total_good: number,
        total_bad: number
        false_positive: number,
        false_negative: number
    }
}

export type DiscardTrainingParameters = {
    drm: string,
    max_length: number,
    good_case_ratio: number
};

const DEFAULT_DISCARD: DiscardTrainingParameters = 
{
    drm: "4c4e",
    max_length: 6,
    good_case_ratio: 25
};

export type DiscardTrainerAction =
| { type: 'set_training_params', settings: Partial<DiscardTrainingParameters> }
| { type: 'get_random_case' }
| { type: 'set_discard_training_case', case: DiscardMetadataCase }
| { type: 'queue_case' }
| { type: 'invalid_settings' }
| { type: 'guess_yes' }
| { type: 'guess_no' }
| { type: 'reset_stats' };

function updateDiscardTrainingParams(current_params: DiscardTrainingParameters, update: Partial<DiscardTrainingParameters>) {
    return {
        ...current_params,
        ...update
    }
}

const ZERO_STATS = {total_good: 0, total_bad: 0, false_positive: 0, false_negative: 0};

const DiscardTrainer = {
    IdleState: (previous_state: AppState, training_params: DiscardTrainingParameters): DiscardTrainerState => {
        let statistics: DiscardTrainerState["statistics"] = getItem('discard_stats', ZERO_STATS);
        return {...previous_state, state: 'discard', substate: 'idle', training_parameters: training_params, 
                current_training: null, queue: {queued: [], time_since_queue: 0}, statistics}
    },

    GettingCaseState: (previous_state: DiscardTrainerState, queue?: {
        time_since_queue: number,
        queued: DiscardMetadataCase[]
    }): DiscardTrainerState => {
        if(!queue) queue = previous_state.queue;
        return {...previous_state, substate: 'getting_case', queue};
    },

    TrainingState: (previous_state: DiscardTrainerState, new_case: DiscardMetadataCase, queue?: {
        time_since_queue: number,
        queued: DiscardMetadataCase[]
    }): DiscardTrainerState => {
        if(!queue) queue = previous_state.queue;
        return {
            ...previous_state,
            substate: 'training',
            current_training: {case: new_case, setup: gen_setup(new_case)},
            queue
        };
    },

    IncorrectChoiceState: (previous_state: DiscardTrainerState, statistics: DiscardTrainerState["statistics"]): DiscardTrainerState => {
        return {
            ...previous_state,
            substate: 'incorrect_choice',
            statistics
        }
    },

    CorrectChoiceState: (previous_state: DiscardTrainerState, statistics: DiscardTrainerState["statistics"]): DiscardTrainerState => {
        return {
            ...previous_state,
            substate: 'correct_choice',
            statistics
        }
    },

    InvalidSettingsState: (previous_state: DiscardTrainerState): DiscardTrainerState => {
        return {
            ...previous_state,
            substate: 'invalid_settings'
        }
    },

    getTrainingParams: (app_state: DiscardTrainerState): DiscardTrainingParameters => {
        return app_state.training_parameters;
    },

    getAppSubState: (app_state: DiscardTrainerState): DiscardTrainerState["substate"] => {
        return app_state.substate;
    },

    getCurrentTraining: (app_state: DiscardTrainerState): null | {case: Case, setup: string} => {
        if(!['training', 'correct_choice', 'incorrect_choice'].includes(app_state.substate)) return null;
        return app_state.current_training;
    }
}

export { DiscardTrainer, updateDiscardTrainingParams, DEFAULT_DISCARD, ZERO_STATS };