import { useState, useEffect } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import Cube from 'cubejs'
import { RzpSelect } from './RzpSelect'
import { useAppState, useAppDispatch, useTrainingParams, useDispatchRandomCase, useCurrentTraining } from './AppContext'
import { InputSlider } from './InputSlider'
import { ScrambleDisplayFrame } from './ScrambleDisplayFrame'
// import { useIndexedDb } from './db'

function App() {

  const state = useAppState();
  const dispatch = useAppDispatch();
  const training_params = useTrainingParams();
  const dispatchRandomCase = useDispatchRandomCase();
  const currentTraining = useCurrentTraining();
  
  let inner;
  if(state[0] == 'setup') {
    inner = <p>loading stuff</p>;
  } else if(state[0] == 'options') {
    inner = <>
      <div className="flex flex-col items-center w-full space-y-4">
        <RzpSelect defaultValue={training_params.drm}></RzpSelect>
        <InputSlider label="Max Optimal" start={1} end={7} defaultValue={training_params.max_length} onChange={(event) => dispatch({type: 'set_training_params',
              settings: {
                  max_length: event.target.value
              }})}></InputSlider>
        <InputSlider label="Max Trigger" start={1} end={6} defaultValue={training_params.max_trigger} onChange={(event) => dispatch({type: 'set_training_params',
              settings: {
                  max_trigger: event.target.value
              }})}></InputSlider>
        <InputSlider label="Min Trigger" start={1} end={6} defaultValue={training_params.min_trigger} onChange={(event) => dispatch({type: 'set_training_params',
              settings: {
                  min_trigger: event.target.value
              }})}></InputSlider>
        <InputSlider label="Max Display" start={1} end={7} defaultValue={training_params.max_display} onChange={(event) => dispatch({type: 'set_training_params',
              settings: {
                max_display: event.target.value
              }})}></InputSlider>
      </div>
      <button className="text-zinc-800" onClick={() => dispatch({type: 'start_training'})}>Start Training</button>
    </>
  } else {
    let training_setup, training_text;
    if(state[1] == "idle"){
      training_setup = "";
      training_text = "Click the button..."
    } else {
      training_setup = currentTraining.setup;
      training_text = training_setup;
    }

    let training_controls;
    if(state[1] == "idle") {
      training_controls = <>
        <button className="text-zinc-800" onClick={dispatchRandomCase}>New Case</button>
      </>
    }
    else if(state[1] == "training") {
      training_controls = <>
        <button className="text-zinc-800" onClick={() => dispatch({type: 'see_solutions'})}>See Solutions</button>
      </>
    }
    else if(state[1] == "showing_solution") {
      training_controls = <>
        <button className="text-zinc-800" onClick={dispatchRandomCase}>New Case</button>
        <div className="h-60 overflow-auto w-1/2">
          {currentTraining.case.solutions.filter(s => s.length <= training_params.max_display).map(s => <p>{s.solution}</p>)}
        </div>
      </>
    }

    inner = <>
      <button className="absolute top-10 left-10 text-zinc-800" onClick={() => dispatch({type: 'change_options'})}>Settings</button>
      <div className="flex flex-col items-center space-y-2 w-full">
        <ScrambleDisplayFrame scramble={training_setup}></ScrambleDisplayFrame>
        <div>{training_text}</div>
        {training_controls}
      </div>
    </>

  }
  return (
    <>
      <div className="relative flex flex-col items-center p-10 space-y-10 text-stone-100 bg-slate-700 w-150 h-[90dvh] rounded-xl">
        <div className="text-4xl">drm doc</div>
        {inner}
      </div>
      <footer>v0.1</footer>
    </>
  )
  
}

export { App };
