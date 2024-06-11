import dayjs from 'dayjs';

export const filtersToURL = (filters) => {
    let urlFilters = [];

    for(let f of filters) { /* type, value */
        if(f.type === 'period') {
            const [ iniDate, endDate ] = f.value;
            if(iniDate) urlFilters.push(`ini_date=${dayjs(iniDate).format('YYYY-MM-DD')}`);
            if(endDate) urlFilters.push(`end_date=${dayjs(endDate).format('YYYY-MM-DD')}`);
        } else if(f.value) urlFilters.push(`${f.type}=${f.value}`);
    }

    return urlFilters.length ? `&${urlFilters.join('&')}` : '';
}