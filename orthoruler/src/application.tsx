import { createRoot } from 'react-dom/client'
import React, { useState } from 'react'
import { useSpring, animated } from '@react-spring/three'
import { Canvas } from '@react-three/fiber'
import { CameraControls, Line, Text, Billboard } from '@react-three/drei'
import { DoubleSide, Vector3 } from 'three'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRuler, faQuestion } from '@fortawesome/free-solid-svg-icons'
import Kiefer from './kfo_case_1'

type target = 'front' | 'left' | 'right' | 'top' | 'bottom' | 'free'

const midpoint = (pos1: Vector3, pos2: Vector3) =>
  [pos1.x/2 + pos2.x/2, pos1.y/2 + pos2.y/2 + 4, pos1.z/2 + pos2.z/2] as unknown as Vector3

const Measurement = (props: JSX.IntrinsicElements['group']) => {
  return (
    <group {...props}>
      <mesh renderOrder={999}>
	<sphereGeometry args={[0.5, 10, 10]} />
	<meshBasicMaterial color="black" side={DoubleSide} transparent depthTest={false} />
      </mesh>
    </group>
  )
} 

const App = () => {
  const [rulerMode, setRulerMode] = useState(false)
  const [lockedAxis, setLockedAxis] = useState<'x' | 'y' | 'z' | null>(null)
  const [okVisible, setOkVisible] = useState(true)
  const [ukVisible, setUkVisible] = useState(true)
  const [semi, setSemi] = useState(false)
  const [view, setView] = useState<target>('free')
  const [measurement1, setMeasurement1] = useState<[number, number, number] | null>(null)
  const [measurement2, setMeasurement2] = useState<[number, number, number] | null>(null)

  const cameraRef = React.useRef<CameraControls>(null)
  const orthoZoom = 20
  const orthoDolly = 2000
  const perspectiveZoom = 1
  const perspectiveDolly = 100

  const setRulerModeTo = (mode: boolean) => {
    if (cameraRef.current) {
      cameraRef.current.enabled = !mode
      setRulerMode(mode)
    }
  }

  const toggleRulerMode = () => {
    setRulerModeTo(!rulerMode)
  }

  const freeMode = () => {
    setMeasurement1(null)
    setMeasurement2(null)
    setLockedAxis(null)
    setView('free')
    if (cameraRef.current) {
      cameraRef.current.zoomTo(perspectiveZoom, true)
      cameraRef.current.dollyTo(perspectiveDolly, true)
    }
  }

  const jump = (target: target) => {
    if (cameraRef.current) {
      // if we are in ruler mode, we need to restore it after the jump
      if (rulerMode) {
	setRulerModeTo(false)
	cameraRef.current.addEventListener('sleep', function restoreRulerMode() {
	  setRulerModeTo(true)
	  if (cameraRef.current) {
	    cameraRef.current.removeEventListener('sleep', restoreRulerMode)
	  }
	})
      }
      // set the camera to fake orthographic projection
      cameraRef.current.zoomTo(orthoZoom, true)
      cameraRef.current.dollyTo(orthoDolly, true)
      // set the camera to the desired view
      let azimuth = 0
      let polar = 0
      switch (target) {
	case 'front':
	  setLockedAxis('y')
	  azimuth = 0
	  polar = Math.PI / 2
	  break
	case 'left':
	  setLockedAxis('x')
	  azimuth = -Math.PI / 2
	  polar = Math.PI / 2
	  break
	case 'right':
	  setLockedAxis('x')
	  azimuth = Math.PI / 2
	  polar = Math.PI / 2
	  break
	case 'top':
	  setLockedAxis('z')
	  azimuth = 0
	  polar = 0
	  break
	case 'bottom':
	  setLockedAxis('z')
	  azimuth = 0
	  polar = Math.PI
	  break
      }
      cameraRef.current.rotateTo(azimuth, polar, true)
      setView(target)
    }
  }

  const setMeasurement = (e: any) => {
    if (e.point as Vector3) {
      if (measurement1 == null || measurement2 != null) {
	setMeasurement1(e.point)
	setMeasurement2(null)
      } else {
	setMeasurement2(e.point)
      }
    }
  }

  const fallback = [0, 0, 0]

  return (
    <>
      <Canvas className="z-0" camera={{far: 10000000}}>
	<CameraControls ref={cameraRef} distance={100} onStart={freeMode} />
        <ambientLight />
        <pointLight position={[100, 100, 10]} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-100, 100, 10]} />
        <Kiefer okVisible={okVisible} ukVisible={ukVisible} semi={semi} rulerMode={rulerMode} setMeasurement={setMeasurement} axis={lockedAxis} />
	{measurement1 && <Measurement position={measurement1} />}
	{measurement2 && <Measurement position={measurement2} />}
	{measurement1 && measurement2 && <Line points={[measurement1, measurement2]} dashed transparent depthTest={false} renderOrder={999} />}
    <Billboard follow position={midpoint(measurement1 as unknown as Vector3 || fallback, measurement2 as unknown as Vector3 || fallback)} renderOrder={999} >
	<Text scale={[4,4,4]}
	      characters="0123456789,.-"
	      color="black">
	  <meshBasicMaterial side={DoubleSide} color="black" transparent depthTest={false} />
	  {measurement1 && measurement2 && `${measurement1.distanceTo(measurement2).toFixed(1)}mm`}
	</Text>
      
    </Billboard>
      </Canvas>
      <div className="absolute top-0 flex flex-col gap-4 p-4 h-full w-24 z-1">
        <button className={[btnCls, rulerMode ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
                onClick={toggleRulerMode}>
          <FontAwesomeIcon icon={faRuler} />
        </button>
        <button className={[btnCls, okVisible ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
                onClick={() => setOkVisible(!okVisible)}>
	  OK
	</button>
	<button className={[btnCls, ukVisible ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
		onClick={() => setUkVisible(!ukVisible)}>
	  UK
	</button>
	<button className={[btnCls, semi ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
		onClick={() => setSemi(!semi)}>
	  T
	</button>
      </div>
      <div className="absolute top-0 right-0 flex flex-col gap-4 p-4 h-full w-24 z-1">
	<button className={[btnCls, view == 'front' ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
		onClick={() => jump('front')}>
	  F
	</button>
	<button className={[btnCls, view == 'left' ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
		onClick={() => jump('left')}>
	  L
	</button>
	<button className={[btnCls, view == 'top' ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
		onClick={() => jump('top')}>
	  O
	</button>
	<button className={[btnCls, view == 'bottom' ? 'text-teal-600' : '!bg-gray-200'].join(' ')}
		onClick={() => jump('bottom')}>
	  U
	</button>
	<button className={[btnCls, view == 'right' ? 'text-teal-600' : '!bg-gray-200', 'mb-auto'].join(' ')}
		onClick={() => jump('right')}>
	  R
	</button>
	<button className={btnCls}>
	  <FontAwesomeIcon icon={faQuestion} />
	</button>
      </div>
    </>
  )
}

const btnCls = [
  "w-full",
  "bg-white",
  "aspect-square",
  "text-4xl",
  "rounded-lg",
  "hover:cursor-pointer",
  "hover:scale-110",
  "transition-all"
].join(' ')

createRoot(document.getElementById('root')!).render(<App/>)

