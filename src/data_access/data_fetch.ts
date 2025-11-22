import { RZPs } from '../constants';
import type { Solution, Case, DrmData } from '../types/types';

const FILE_DIR_BASE = "/drm_doc";

class DrmDataFileReader {
    
    #parseCaseData(case_data: string): {cases: Case[], solutions: Solution[]} {
    
        let text = case_data.split("\n")
        let cases: Case[] = [];
        let solutions: Solution[] = [];
        for(let i = 0; i < text.length; i++) {
            let line_data = text[i].split(",")
            if(line_data[0] == "case"){
                cases[parseInt(line_data[1])] = {
                    id: parseInt(line_data[1]),
                    rzp: line_data[2],
                    arm: line_data[3],
                    pairs: parseInt(line_data[4]),
                    tetrad: line_data[5] == '' ? null : line_data[5],
                    corners: line_data[6] == '' ? null : line_data[6],
                    solutions: []
                }
            }
            else if(line_data[0] == "solution"){
                let soln = {
                    "caseId": parseInt(line_data[1]),
                    "length": parseInt(line_data[2]),
                    "eo_breaking": (line_data[3] == "1"),
                    "trigger": parseInt(line_data[4]),
                    "solution": line_data[5]
                }
                solutions.push(soln)
                cases[parseInt(line_data[1])].solutions.push(soln)
            }
        }
        return {"cases": cases, "solutions": solutions};
    }

    async readRzpData(rzp: string): Promise<DrmData> {
        let response = await fetch(FILE_DIR_BASE +"/" + rzp + "_db_input.csv");
        return this.#parseCaseData(await response.text());
    }

    async readVersionData(): Promise<Record<string, number>> {
        let response = await fetch(FILE_DIR_BASE + "/versions.csv");
        let text = (await response.text()).split("\n");

        let versions = {};

        for(let i = 0; i < text.length; i++) {
            let line_data = text[i].split(",")
            versions[line_data[0]] = Number(line_data[1])
        }
        return versions;
    }

}


class DrmDataAccess {
    db: IDBDatabase;

    constructor(idb_db: IDBDatabase) {
        this.db = idb_db;
    }

    async setDrmData(drm: string, drm_data: DrmData, version: number): Promise<DrmData> {
        let transaction = this.db.transaction(["drm_data"], "readwrite");
        let drm_data_store = transaction.objectStore("drm_data");
        drm_data_store.put({"drm": drm, "data": drm_data});
        let metadata_store = transaction.objectStore("metadata");
        metadata_store.put({"meta_key": drm, "version": version})
        transaction.commit();
        return drm_data;
    }

    // throws if doesn't exist
    async getDrmData(drm: string): Promise<DrmData|null> {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(["drm_data"], "readonly");
            let drm_data_store = transaction.objectStore("drm_data");
            let request = drm_data_store.get(drm);
            request.onerror = reject;
            request.onsuccess = _ev => {
                if(!request.result) resolve(null);
                else resolve(request.result.data);
            }
        });
    }

    // throws if doesn't exist
    async getDrmDataVersion(drm: string): Promise<number|null> {
        return new Promise((resolve, reject) => {
            let transaction = this.db.transaction(["drm_data"], "readonly");
            let metadata_store = transaction.objectStore("metadata");
            let request = metadata_store.get(drm);
            request.onerror = reject;
            request.onsuccess = _ev => {
                if(!request.result) resolve(null);
                else resolve(request.result.version);
            }
        });
    }

}


class DrmDataCache {
    data: Record<string, DrmData> = {};
    versions: Record<string, number>;
    access: DrmDataAccess;
    reader: DrmDataFileReader;

    constructor(reader: DrmDataFileReader, access: DrmDataAccess) {
        this.reader = reader;
        this.access = access;
    }

    async warmup() {
        this.#getMostRecentVersions();

        for(let rzp of RZPs) {
            await this.#updateDbAndGetMostRecent(rzp);
        }
    }

    async #getMostRecentVersions() {
        if(!this.versions) this.versions = await this.reader.readVersionData();
    }

    async #updateDbAndGetMostRecent(drm: string) {
        let version = await this.access.getDrmDataVersion(drm);

        let drm_data: DrmData;
        if(version < this.versions[drm]) {
            drm_data = await this.reader.readRzpData(drm);
            this.access.setDrmData(drm, drm_data, version);
        }
        else {
            drm_data = await this.access.getDrmData(drm);
        }
        this.data[drm] = drm_data;
    }

    async getDrmData(drm: string): Promise<DrmData> {
        if(!this.data[drm]) {
            this.#getMostRecentVersions();
            this.#updateDbAndGetMostRecent(drm);
        }
        return this.data[drm];
    }

}

export {DrmDataCache, DrmDataAccess, DrmDataFileReader};