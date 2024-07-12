import { TextField, MenuItem } from '@mui/material';
import DatePicker from '../../components/DatePicker';

export default function FieldRenderer({ f }) {

    if (f.type === 'options') {
        return <TextField
            className="input-text"
            label={f.title}
            value={'none'}
            select
            onChange={console.log}
        >
            <MenuItem value="none">Não respondido</MenuItem>
            {f.options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
    }

    if (f.type === 'yearpicker') return <DatePicker
        className="input-datepicker"
        label={f.title}
        value={new Date()}
        onChange={console.log}
        views={['year']}
        inputFormat="yyyy"
    />

    return <TextField
        className="input-text"
        label={f.title}
        value={''}
        onChange={console.log}
    />
}