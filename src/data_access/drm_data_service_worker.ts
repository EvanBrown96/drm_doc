
import { RZPs } from '../constants';
import { Case, Solution } from '../types/types';
import { DrmDataAccess, DrmDataCache, DrmDataFileReader } from './data_fetch';
import { connectToDb } from './db';


const cache_promise = (async () => {
    const reader = new DrmDataFileReader();
    const db = await connectToDb();
    const access = new DrmDataAccess(db);
    const cache = new DrmDataCache(reader, access);
    return cache;
})();

cache_promise.then(cache => cache.warmup());


let filtered_cache = new Map<string, Case[]>();

onmessage = async (msg) => {

    const new_filter = JSON.stringify(msg.data);

    let filtered_data: Case[];

    if(filtered_cache.has(new_filter)) {
        filtered_data = filtered_cache.get(new_filter);
    }
    else {
        const cache = await cache_promise;

        filtered_data = await getFilteredCases(cache, msg.data.drm, msg.data.min_length, msg.data.max_length, msg.data.min_trigger, msg.data.max_trigger, msg.data.eo_breaking)
        
        if(filtered_data.length < 1) {
            self.postMessage({"status": "failed", "error": "invalid_settings"})
            return;
        }

        filtered_cache.set(new_filter, filtered_data);
    }

    let rand_case = filtered_data[Math.floor(Math.random()*filtered_data.length)];

    self.postMessage({"status": "success", "case": rand_case});
    
}


async function getFilteredCases(cache: DrmDataCache, rzp: string, min_length: number, max_length: number, min_trigger: number, max_trigger: number, eo_breaking: boolean): Promise<Case[]> {

    if(rzp == "all") {
        let cases: Case[] = [];
        for(let r of RZPs){
            cases = cases.concat(await getFilteredCases(cache, r, min_length, max_length, min_trigger, max_trigger, eo_breaking));
        }
        return cases;
    }
    let data = await cache.getDrmData(rzp);

    let matching_solns: Solution[] = data.solutions.filter(s => {
        if(s["length"] > max_length) return false;
        if(s["eo_breaking"] && !eo_breaking) return false;
        if(!s["eo_breaking"]) {
            if(s["trigger"] > max_trigger) return false;
            if(s["trigger"] < min_trigger) return false;
        }
        if(s["length"] < min_length) return false;
        return true;
    })

    return [...new Set(matching_solns.map(s => data["cases"][s["caseId"]]))]

}
