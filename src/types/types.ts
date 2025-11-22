export type Solution = {
    caseId: number,
    length: number,
    eo_breaking: boolean,
    trigger: number,
    solution: string
};

export type Case = {
    id: number,
    rzp: string,
    arm: string,
    pairs: number,
    tetrad: null | string,
    corners: null | string,
    solutions: Solution[]
};

export type DrmData = {
    cases: Case[],
    solutions: Solution[]
};