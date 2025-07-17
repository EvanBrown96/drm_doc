import { useRef, useEffect, useState } from 'react';
import { ScrambleDisplay } from 'scramble-display';

function ScrambleDisplayFrame({scramble}) {
    const ref = useRef(null)
    const [displayElem, setDisplayElem] = useState(null)

    useEffect(() => {
        const sd = new ScrambleDisplay();
        sd.event = "333";
        sd.scramble = scramble;
        sd.visualization = "3D";
        while(ref.current.firstChild){
            ref.current.removeChild(ref.current.lastChild)
        }
        ref.current.appendChild(sd);
    }, [scramble])

    return <div ref={ref}></div>
}

export { ScrambleDisplayFrame };