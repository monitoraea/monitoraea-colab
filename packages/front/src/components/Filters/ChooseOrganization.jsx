import React, { useState } from "react";

import AsyncAutocompleteSuggest from "../AsyncAutocompleteSuggest";

import { useRouter } from 'dorothy-dna-react';

export default function ChooseOrganization({ filters, onChange }) {

    const { currentCommunity } = useRouter();

    const [value, _value] = useState(null);

    const handleChange = (value) => {
        onChange(value);
        _value(value);
    };

    return (<AsyncAutocompleteSuggest
        url="organization/by_context"
        urlSingle="organization"
        query={`?communityId=${currentCommunity.id}`}
        onChange={handleChange}
        value={value}
    />);
};