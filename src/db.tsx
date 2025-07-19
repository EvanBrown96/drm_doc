import { useState, useEffect } from 'react';
import { RZPs } from './rzp_constants';

export type Solution = {
    caseId: number,
    length: number,
    eo_breaking: boolean,
    trigger: number,
    solution: string
}

export type Case = {
    id: number,
    rzp: string,
    arm: string,
    pairs: number,
    tetrad: null | string,
    corners: null | string,
    solutions: Solution[]
}



async function readFromFile(rzp): Promise<{cases: Case[], solutions: Solution[]}> {
    let response = await fetch("/drm_doc/" + rzp + "_db_input.csv");
    let text = (await response.text()).split("\n")
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

function useDb(){
    const [data, setData] = useState(null);
    const [loaded, setLoaded] = useState(false);
    
    useEffect(() => {
        (async () => {
            let file_data = {};
            for(let r of RZPs) {
                file_data[r] = await readFromFile(r);
            }
            setData(file_data);
            setLoaded(true);
            console.log("finished drm data loading")
        })()
    }, []);

    function getCases(rzp: string, min_length: number, max_length: number, min_trigger: number, max_trigger: number): Case[] {
        if(!loaded) throw new Error("file not loaded");
        let matching_solns: Solution[] = data[rzp]["solutions"].filter(s => {
            if(s["length"] > max_length) return false;
            if(s["trigger"] > max_trigger) return false;
            if(s["trigger"] < min_trigger) return false;
            if(s["length"] < min_length) return false;
            return true;
        })

        return [...new Set(matching_solns.map(s => data[rzp]["cases"][s["caseId"]]))]
    }

    return {loaded, getCases};

}

export { useDb };