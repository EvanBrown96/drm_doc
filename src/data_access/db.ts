const DB_PARAMS = {
    name: "drm",
    version: 3
};

async function connectToDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open(DB_PARAMS.name, DB_PARAMS.version);

        request.onupgradeneeded = (event) => {
            console.log("upgrading db")
            const database = request.result;
            if(event.oldVersion < 1) {
                console.log("upgrading to version 1");
                database.createObjectStore("drm_data", {'keyPath': 'drm'})
            }
            if(event.oldVersion < 3) {
                console.log("upgrading to version 3");
                database.createObjectStore("metadata", {'keyPath': 'meta_key'})
            }
        }

        request.onsuccess = () => {
            console.log("successfully connected to db");
            resolve(request.result)
        }

        request.onerror = () => {
            console.error("error initialized indexedDB:", request.error)
            reject(request.error)
        }

        request.onblocked = () => {
            console.error("db upgrade blocked")
            reject(request.error)
        }
    })
}

export { connectToDb };