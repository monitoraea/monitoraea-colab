import React, { useState, useEffect } from 'react';

import dayjs from 'dayjs';

export default function NewUserNotification({ data }) {
    const [date, _date] = useState('');
    const [sender, _sender] = useState('');

    /* TODO: recuperar dados do usuario */

    useEffect(() => {
        if (!data) return;

        _date(dayjs(data.createdAt).format('DD/MM/YYYY HH:mm'));
        _sender(data.user_name);
    }, [data]);

    return (<div>
        {date}{' '}
        <strong>{sender}</strong> criou um novo usuario: "[Usuario]"
    </div>
    )
}