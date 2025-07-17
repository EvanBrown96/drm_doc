import { useEffect, useState } from 'react';
import { readFromFile  } from './readRzpData';

const db_params = {
    name: "drm",
    version: 1
};

type DbState = { status: 'ready'}
             | { status: 'error', error: any }
             | { status: 'loading' }
             | { status: 'populating' };

function useIndexedDb() {

    const [dbState, setDbState] = useState<DbState>({status: 'loading'});
    const [db, setDb] = useState<IDBDatabase>(null);

    useEffect(() => {
        console.log("db state: " + dbState.status)
        if(dbState.status == 'loading') {
            console.log("creating indexedDB connection");
            const request = indexedDB.open(db_params.name, db_params.version);

            request.onupgradeneeded = (event) => {
                console.log("upgrading db")
                localStorage.removeItem("dbPopulated");
                const database = request.result;
                if(event.oldVersion == 0){
                    console.log("upgrading from version 0");
                    let case_store = database.createObjectStore('case', {'keyPath': 'id'})
                    case_store.createIndex('rzp', 'rzp')

                    let soln_store = database.createObjectStore('solution', {'autoIncrement': true});
                    soln_store.createIndex('caseId', 'caseId')
                    soln_store.createIndex('filter', ['eo_breaking', 'length', 'trigger'])
                }
            }

            request.onsuccess = () => {
                console.log("successfully connected to db");
                setDbState({status: 'populating'});
                setDb(request.result);
            }

            request.onerror = () => {
                console.error("error initialized indexedDB:", request.error)
                setDbState({status: 'error', error: request.error})
            }

            request.onblocked = () => {
                console.error("db upgrade blocked")
                setDbState({status: 'error', error: "db upgrade blocked"})
            }

        }
    }, [db, dbState]);

    useEffect(() => {
        if(dbState.status == "populating"){
            if(localStorage.getItem('dbPopulated')){
                setDbState({status: "ready"});
                return;
            }
            console.log("populating database");
            (async () => {
                let file_data = await readFromFile();
                let transaction = db.transaction(["case", "solution"], "readwrite")
                let cases = transaction.objectStore("case")
                cases.clear();
                for(let c of file_data["cases"]){
                    cases.add(c)
                }
                let solutions = transaction.objectStore("solution")
                solutions.clear();
                for(let s of file_data["solutions"]){
                    solutions.add(s);
                }
                transaction.oncomplete = () => {
                    localStorage.setItem('dbPopulated', 'true');
                    setDbState({status: "ready"});
                }
                transaction.onerror = () =>
                    setDbState({status: "error", error: transaction.error})
            })();
        }
    });
    
    function getTransaction(tableName: string, mode: IDBTransactionMode) {
        if(dbState.status != 'ready') throw new Error("db not initialized");
        return db.transaction(tableName, mode).objectStore(tableName);
    }

    async function putCase() {  
        const t = getTransaction("case", "readwrite")
        return new Promise((resolve, reject) => {
            let req = t.put({id: 4, rzp: "44"})
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        })
    }

    return {
        dbState,
        putCase
    }

}


export { useIndexedDb };