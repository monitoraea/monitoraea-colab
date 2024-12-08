export function indicsTree(data) {
    let tree = [];

    for(let dimKey of Object.keys(data.analysis.dims)) {
        const dim = data.analysis.dims[dimKey];
        dim.id = dimKey;
        dim.indics = [];

        tree.push(dim);
    }
    for(let indicKey of Object.keys(data.analysis.indics)) {
        const indic = data.analysis.indics[indicKey];
        indic.id = indicKey;
        const dimId = indicKey.split('_')[0];

        tree.find(d => d.id === dimId).indics.push(indic);
    }

    return tree;
}

export function getDimTitle(structure, id) {
    const dim = getDimension(structure, id)
    
    return dim.title
}
export function getIndicTitle(structure, d, id) {
    const dim = getDimension(structure, d)

    return getIndicFromDim(dim,  id).title
}

export function getIndicForm(structure, d, id) {
    const dim = getDimension(structure, d)
    const indic = getIndicFromDim(dim,  id)

    return indic.form
}

export function getFormProblems(indic, problems) {
    const relevantProblems = problems.filter(p => p.includes(indic)).map(p => p.replace(`${indic}_`, ''))
    return relevantProblems
}

function getDimension(structure, id) {
    return structure.find(d => d.id === id)
}
function getIndicFromDim(dim,  id) {
    return dim.indics.find(i => i.id === id)
}