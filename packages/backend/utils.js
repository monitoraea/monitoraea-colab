module.exports.applyJoins = function (joins) {
    return joins.join('\n');
}

module.exports.applyWhere = function (where) {
    if (!where.length) return '';
    return `where ${where.join('\nand ')}`;
}

module.exports.capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports.getIds = function (list) {
    return list.map(({ id }) => id).join(',')
}

module.exports.defaults = {
    limit: 10,
}

module.exports.protect = {
    order: (text) => text.split(' ')[0],
    direction: (text) => text.split(' ')[0],
    number_array: (text) => text.split(' ')[0],
}

module.exports.countAlerts = (row, haC, laC) => {

    const testFuncs = {
        'empty-field': (value) => {
            return (value === null || value === undefined);
        },

        'empty-value': (value) => {
            return (value === null || value === undefined || value === 0);
        }
    }

    let ha = [], la = [];

    for (let [config, alerts] of [[haC, ha], [laC, la]])
        for (let rule of config) if (testFuncs[rule.inconsistence](row[rule.field])) alerts.push(rule.label ? rule.label : rule.field);

    return {
        ha,
        la,
    }
}

module.exports.getSegmentedId = (id) => {
    let segmentedId = String(id);
    while (segmentedId.length < 9) segmentedId = `0${segmentedId}`;

    return segmentedId.match(/.{1,3}/g).join('/');
}