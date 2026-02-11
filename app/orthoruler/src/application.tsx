import { createRoot } from "react-dom/client";
import React, {useEffect, useState} from "react";
import { useSpring, animated } from "@react-spring/three";
import { Canvas } from "@react-three/fiber";
import { CameraControls, Line, Text, Billboard } from "@react-three/drei";
import { DoubleSide, Vector3 } from "three";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import Kiefer from "./model";

type target = "front" | "left" | "right" | "top" | "bottom" | "free";

const midpoint = (positions: [[number, number, number]]) =>
  [
    positions
      .map((p) => p.x / positions.length)
      .reduce((partialSum, a) => partialSum + a, 0),
    positions
      .map((p) => p.y / positions.length)
      .reduce((partialSum, a) => partialSum + a, 2),
    positions
      .map((p) => p.z / positions.length)
      .reduce((partialSum, a) => partialSum + a, 0),
  ] as unknown as Vector3;

//[pos1.x/2 + pos2.x/2, pos1.y/2 + pos2.y/2 + 4, pos1.z/2 + pos2.z/2] as unknown as Vector3

const Measurement = (props: JSX.IntrinsicElements["group"]) => {
  return (
    <group {...props}>
      <mesh renderOrder={999}>
        <sphereGeometry args={[0.25, 10, 10]} />
        <meshBasicMaterial
          color="black"
          side={DoubleSide}
          transparent
          depthTest={false}
        />
      </mesh>
    </group>
  );
};

const App = () => {
  const [rulerMode, setRulerMode] = useState(false);
  const [lockedAxis, setLockedAxis] = useState<"x" | "y" | "z" | null>(null);
  const [okVisible, setOkVisible] = useState(true);
  const [ukVisible, setUkVisible] = useState(true);
  const [semi, setSemi] = useState(false);
  const [view, setView] = useState<target>("free");
  const [measurement1, setMeasurement1] = useState<
    [number, number, number] | null
  >(null);
  const [measurement2, setMeasurement2] = useState<
    [number, number, number] | null
  >(null);
  const [measurements, setMeasurements] = useState<[[number, number, number]]>(
    [],
  );

  const cameraRef = React.useRef<CameraControls>(null);
  const orthoZoom = 20;
  const orthoDolly = 2000;
  const perspectiveZoom = 1;
  const perspectiveDolly = 100;

  const setRulerModeTo = (mode: boolean) => {
    setRulerMode(mode);
  };

  const toggleRulerMode = () => {
    setRulerModeTo(!rulerMode);
  };

  const freeMode = () => {
    setLockedAxis(null);
    setView("free");
    if (cameraRef.current) {
      cameraRef.current.enabled = true;
      console.log(cameraRef.current);
    }
  };

  const jump = (target: target) => {
    if (cameraRef.current) {
      // if we are in ruler mode, we need to restore it after the jump
      if (rulerMode) {
        setRulerModeTo(false);
        cameraRef.current.addEventListener(
          "sleep",
          function restoreRulerMode() {
            setRulerModeTo(true);
            if (cameraRef.current) {
              cameraRef.current.removeEventListener("sleep", restoreRulerMode);
            }
          },
        );
      }
      // set the camera to the desired view
      let azimuth = 0;
      let polar = 0;
      switch (target) {
        case "front":
          setLockedAxis("y");
          azimuth = 0;
          polar = Math.PI / 2;
          break;
        case "left":
          setLockedAxis("x");
          azimuth = -Math.PI / 2;
          polar = Math.PI / 2;
          break;
        case "right":
          setLockedAxis("x");
          azimuth = Math.PI / 2;
          polar = Math.PI / 2;
          break;
        case "top":
          setLockedAxis("z");
          azimuth = 0;
          polar = 0;
          break;
        case "bottom":
          setLockedAxis("z");
          azimuth = 0;
          polar = Math.PI;
          break;
      }
      cameraRef.current.rotateTo(azimuth, polar, true);
      setView(target);
    }
  };
  // statt enabled cameraControls.mouseButtons.left = CameraConsole.ACTIONS.NONE
  // und auf die axis legen

  const setMeasurement = (e: any) => {
    if (e.point as Vector3) {
      if (!rulerMode && measurements.length >= 2) {
        setMeasurements([e.point]);
      } else {
        setMeasurements([...measurements, e.point]);
      }
    }
  };

  const getLineLength = (points: [[number, number, number]]) => {
    if (points.length <= 1) {
      return null;
    }
    if (points.length > 1) {
      let distance = points.reduce(
        ([partialSum, previousCoordinate], coordinate) => [
          partialSum + Math.abs(previousCoordinate.distanceTo(coordinate)),
          coordinate,
        ],
        [0, new Vector3(0, 0, 0)],
      )[0];
      distance = distance - new Vector3(0, 0, 0).distanceTo(points[0]);
      return `${distance.toFixed(1)} mm`;
    } else {
      return "0 mm";
    }
    //{measurement1 && measurement2 && `${measurement1.distanceTo(measurement2).toFixed(1)}mm`}
  };

  const fallback = [0, 0, 0];

  useEffect(() => {
    if (cameraRef.current) {
    // set the camera to fake orthographic projection
      cameraRef.current.zoomTo(orthoZoom, true);
      cameraRef.current.dollyTo(orthoDolly, true);
    }
  }, []);

  return (
    <>
      <Canvas className="z-0" camera={{ zoom: 20, far: 10000000 }}>
        <CameraControls
          ref={cameraRef}
          distance={2000}
          azimuthRotateSpeed={rulerMode ? 0 : 1}
          polarRotateSpeed={rulerMode ? 0 : 1}
        />
        <ambientLight />
        <pointLight position={[100, 100, 10]} />
        <pointLight position={[10, 10, 10]} />
        <pointLight position={[-100, 100, 10]} />
        <Kiefer
          okVisible={okVisible}
          ukVisible={ukVisible}
          semi={semi}
          rulerMode={rulerMode}
          setMeasurement={setMeasurement}
          axis={lockedAxis}
        />
        {measurements.map((measurement, i) => (
          <Measurement key={i} position={measurement} />
        ))}
        {measurements.length > 1 && (
          <Line
            points={measurements}
            dashed
            transparent
            depthTest={false}
            renderOrder={999}
          />
        )}
        <Billboard follow position={midpoint(measurements)} renderOrder={999}>
          <Text scale={[4, 4, 4]} characters="0123456789,.-" color="black">
            <meshBasicMaterial
              side={DoubleSide}
              color="black"
              transparent
              depthTest={false}
            />
            {getLineLength(measurements)}
          </Text>
        </Billboard>
      </Canvas>
      <div className="absolute top-0 flex flex-col gap-4 p-4 h-full w-24 z-1">
        <button
          className={[
            btnCls,
            rulerMode ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={toggleRulerMode}
        >
          <img className="h-10 w-10" src="ruler.svg" />
        </button>
        <button
          className={[
            btnCls,
            okVisible ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={() => setOkVisible(!okVisible)}
        >
          <img className="h-10 w-10" src="ok.svg" />
        </button>
        <button
          className={[
            btnCls,
            ukVisible ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={() => setUkVisible(!ukVisible)}
        >
          <img className="h-10 w-10" src="uk.svg" />
        </button>
        <button
          className={[btnCls, semi ? "text-teal-600" : "!bg-gray-200"].join(
            " ",
          )}
          onClick={() => setSemi(!semi)}
        >
          <img className="h-10 w-10" src="transparent.svg" />
        </button>
        {measurements.length > 0 && (
          <button className={btnCls} onClick={() => setMeasurements([])}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-10 w-10 m-auto"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="absolute top-0 right-0 flex flex-col gap-4 p-4 h-full w-24 z-1">
        <button
          className={[
            btnCls,
            view == "front" ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={() => freeMode()}
        >
          <img className="h-10 w-10" src="free.svg" />
        </button>
        <button
          className={[
            btnCls,
            view == "front" ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={() => jump("front")}
        >
          <img className="h-10 w-10" src="front.svg" />
        </button>
        <button
          className={[
            btnCls,
            view == "left" ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={() => jump("left")}
        >
          <img className="h-10 w-10" src="left.svg" />
        </button>
        <button
          className={[
            btnCls,
            view == "top" ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={() => jump("top")}
        >
          <img className="h-10 w-10" src="top.svg" />
        </button>
        <button
          className={[
            btnCls,
            view == "bottom" ? "text-teal-600" : "!bg-gray-200",
          ].join(" ")}
          onClick={() => jump("bottom")}
        >
          <img className="h-10 w-10" src="bottom.svg" />
        </button>
        <button
          className={[
            btnCls,
            view == "right" ? "text-teal-600" : "!bg-gray-200",
            "mb-auto",
          ].join(" ")}
          onClick={() => jump("right")}
        >
          <img className="h-10 w-10" src="right.svg" />
        </button>
        <button className={btnCls}>
          <FontAwesomeIcon icon={faQuestion} />
        </button>
      </div>
    </>
  );
};

const btnCls = [
  "w-full",
  "bg-white",
  "aspect-square",
  "text-4xl",
  "rounded-lg",
  "hover:cursor-pointer",
  "hover:scale-110",
  "transition-all",
  "flex",
  "justify-center",
  "items-center",
].join(" ");

createRoot(document.getElementById("root")!).render(<App />);
