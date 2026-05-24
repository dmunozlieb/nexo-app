import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

type NexoMarkProps = {
  size?: number;
  withBackground?: boolean;
};

export function NexoMark({ size = 72, withBackground = true }: NexoMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      {withBackground ? <Rect width="512" height="512" rx="108" fill="#090A12" /> : null}
      <Ellipse
        cx="256"
        cy="258"
        rx="178"
        ry="116"
        transform="rotate(-24 256 258)"
        stroke="url(#nexoOrbit)"
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray="422 116"
      />
      <Path
        d="M160 348V166L352 348V166"
        stroke="#F7FAFF"
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M160 348V166L352 348V166"
        stroke="url(#nexoLetterSheen)"
        strokeWidth="42"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.26"
      />
      <Circle cx="160" cy="166" r="22" fill="#7C5CFF" />
      <Circle cx="352" cy="348" r="22" fill="#00D4FF" />
      <Circle cx="360" cy="160" r="13" fill="#FF4FD8" />
      <Defs>
        <LinearGradient id="nexoOrbit" x1="78" y1="142" x2="434" y2="374">
          <Stop stopColor="#7C5CFF" />
          <Stop offset="0.52" stopColor="#00D4FF" />
          <Stop offset="1" stopColor="#FF4FD8" />
        </LinearGradient>
        <LinearGradient id="nexoLetterSheen" x1="152" y1="160" x2="360" y2="356">
          <Stop stopColor="#FFFFFF" />
          <Stop offset="0.52" stopColor="#DDFBFF" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
