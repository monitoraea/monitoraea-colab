module.exports.check = (oForm, data) => {

    const form = {...oForm}

    // merge elements of blocks
    for (let b of form.blocks) {
        mergeBlockElement(b, form)
    }

    let is_form_valid = true
    let fields = {}
    for (let f of form.fields) {

        if (!isFieldVisible(f, form, data)) { // se não está visivel, então está ok
            fields[f.key] = true
            continue
        }

        if (f.validation && f.validation.length) {
            if (!Array.isArray(f.validation)) f.validation = [f.validation]

            let error = false
            for (let v of f.validation) {
                const type = v.type || v

                switch (type) {
                    case 'neq':
                       if(notEmpty(data?.[f.key]) && is_neq(data[f.key], v)) error = true
                        break
                    case 'not_empty':
                        if(!notEmpty(data?.[f.key]) || is_empty(data[f.key], f.type)) error = true
                        break
                    case 'at_least_one':
                        if(!notEmpty(data?.[f.key]) || at_least_one(data[f.key])) error = true
                        break
                    default:
                    // do nothing
                }
            }
            fields[f.key] = !error
            if (error) is_form_valid = false
        }
    }

    return {
        is_form_valid,
        fields,
    }
}

function is_neq(data, v) {
    if (v.value && data === v.value) return true
    return false
}

function is_empty(data, field_type) {
    if (['text', 'textarea'].includes(field_type) && !data?.trim().length) return true
    if (['file', 'thumbnail'].includes(field_type) && !data) return true
    return false
}

function at_least_one(data) {
    return !data.length
}

function mergeBlockElement(b, form) {
    // insere os campos com propriedade block em elements
    let elements = b.elements ? [...b.elements] : []
    for (let f of form.fields.filter(f => f.block === b.key)) {
        elements.push(f.key)
    }
    elements.sort((a, b) => a.type === 'block' ? 1 : 0)

    b.elements = [...b.elements || [], ...elements]
}

function isFieldVisible(f, form, data) {
    // TODO: nesting visibility (blocks inside blocks where parent has visibility rule) -> ISSUE

    // FIELDS
    let show = checkShow(f, data)
    // PARENT BLOCK
    if (show) {
        // qual o bloco do campo?
        const block = form.blocks.find(b => b.elements.includes(f.key))
        // analisa visibilidade do bloco
        if (block) show = checkShow(block, data)
    }

    return show
}

function checkShow(e, data) {
    let show = true

    if (e.show?.target) {
        if (!Array.isArray(e.show.target.value)) show = (data?.[e.show.target.key] === e.show.target.value);
        else show = e.show.target.value.includes(data?.[e.show.target.key])
    }

    return show
}

function notEmpty(v) {
    return (v !== null && v !== undefined)
}