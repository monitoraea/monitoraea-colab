module.exports.check = (form, data) => {
    // TODO: is visible (own show property or its block property) 
    // TODO: nesting visibility (blocks inside blocks where parent has visibility rule) -> ISSUE
    
    let is_form_valid = true
    let fields = {}
    for(let f of form.fields) {
        if(f.validation && f.validation.length) {
            if(!Array.isArray(f.validation)) f.validation = [f.validation]

            for(let v of f.validation) {
                const type = v.type || v

                let error = false
                switch(type) {
                    case 'neq':
                        error = is_neq(data[f.key], v)
                        break
                    case 'not_empty':
                        error = is_empty(data[f.key], f.type, v)
                        break
                    default:
                        // do nothing
                }

                fields[f.key] = !error
                if(error) is_form_valid = false
            }
        }
    }

    return {
        is_form_valid,
        fields,
    }
}

function is_neq(data, v) {
    if(v.value && data === v.value) return true
    return false
}

function is_empty(data, field_type, v) {
    if(['text', 'textarea'].includes(field_type) && !data.trim().length) return true
    if(['file', 'thumbnail'].includes(field_type) && !data) return true
    return false
}