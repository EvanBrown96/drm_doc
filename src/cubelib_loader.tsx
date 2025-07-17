import { useState, useEffect } from 'react';
import Cube from 'cubejs'

function useCubelib(){
    const [loaded, setLoaded] = useState(false);
    
    useEffect(() => {
        Cube.initSolver()
        console.log("finished cubelib init");
        setLoaded(true);
    }, []);

    return {loaded};

}

export { useCubelib };
