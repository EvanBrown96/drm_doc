import { useState } from 'react';
import { useAppDispatch, useTrainingParams } from './AppContext.jsx';

function InputSlider({label, start, end, defaultValue, onChange}) {

    const [internal_value, set_internal] = useState(defaultValue);

    let onChange2 = (event) => {
        onChange(event);
        set_internal(event.target.value)
    }

    return (
        <div className="w-full flex flex-row justify-between">
            <div>{label}</div>
            <input type="range" step={1} min={start} max={end} defaultValue={defaultValue} onChange={onChange2} />
            <div>{internal_value}</div>
        </div>)

}

export { InputSlider };
