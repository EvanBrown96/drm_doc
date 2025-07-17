import { RZPs } from './rzp_constants.js';
import { useAppDispatch, useTrainingParams } from './AppContext.jsx';

function RzpSelect() {
    const app_dispatch = useAppDispatch();
    const training_params = useTrainingParams();
    console.log(training_params)

    function updateStateWithDrm(new_drm) {
        app_dispatch({
            type: 'set_training_params',
            settings: {
                drm: new_drm
            }
        })
    }

    return <select onChange={(event) => updateStateWithDrm(event.target.value)}>
        {RZPs.map(r => <option key={r}>{r}</option>)}
    </select>
}

export { RzpSelect };