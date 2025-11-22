import { useMemo } from 'react';
import type { Case } from '../types/types';
import DrmWorker from './drm_data_service_worker.ts?worker';

class DrmService {

    worker;

    constructor() {
        this.worker = new DrmWorker();
    }

    async getRandomCase(rzp: string, min_length: number, max_length: number, min_trigger: number, max_trigger: number, eo_breaking: boolean): Promise<Case> {
        this.worker.postMessage({drm: rzp, min_length, max_length, min_trigger, max_trigger, eo_breaking});
        const ret_case: Case = await new Promise((resolve, reject) => {
            this.worker.onmessage = event => {
                if(event.data.status == "success") resolve(event.data.case);
                else reject(event.data.error);
            };
        });
        return ret_case;
    }
}

function useDrmService(): DrmService {

    const service = useMemo(() => new DrmService(), []);
    return service;

}

export { useDrmService };