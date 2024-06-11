export default function indicsTree(data) {
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