/**
 * Anime / cartoon-style SVG illustrations for each Shield assessment category.
 * React Native port of the web ShieldIllustrations using react-native-svg.
 * Each illustration is 120×120 viewBox, rendered at the size passed via style.
 */

import Svg, {
  Circle,
  Ellipse,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Text as SvgText,
} from 'react-native-svg'
import type { ViewStyle } from 'react-native'

interface IllustrationProps {
  style?: ViewStyle
  size?: number
}

/* ------------------------------------------------------------------ */
/* 1. Builder — hard-hat character with clipboard                      */
/* ------------------------------------------------------------------ */
export function BuilderIllustration({ style, size = 120 }: IllustrationProps) {
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} style={style}>
      <Ellipse cx={60} cy={38} rx={28} ry={12} fill="#10b981" opacity={0.18} />
      <Path d="M34 42c0-14 11.6-26 26-26s26 12 26 26" stroke="#10b981" strokeWidth={3} strokeLinecap="round" />
      <Rect x={30} y={40} width={60} height={6} rx={3} fill="#10b981" />
      <Circle cx={60} cy={58} r={14} fill="#1e293b" stroke="#10b981" strokeWidth={2} />
      <Circle cx={54} cy={56} r={2} fill="#10b981" />
      <Circle cx={66} cy={56} r={2} fill="#10b981" />
      <Path d="M55 63c2.5 3 7.5 3 10 0" stroke="#10b981" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M46 72c0 0 4 14 14 14s14-14 14-14" stroke="#10b981" strokeWidth={2} strokeLinecap="round" />
      <Rect x={78} y={54} width={18} height={24} rx={3} fill="#10b981" opacity={0.15} stroke="#10b981" strokeWidth={1.5} />
      <Rect x={81} y={58} width={5} height={1.5} rx={0.75} fill="#10b981" opacity={0.6} />
      <Rect x={81} y={62} width={12} height={1.5} rx={0.75} fill="#10b981" opacity={0.4} />
      <Rect x={81} y={66} width={10} height={1.5} rx={0.75} fill="#10b981" opacity={0.4} />
      <Rect x={81} y={70} width={8} height={1.5} rx={0.75} fill="#10b981" opacity={0.4} />
      <Circle cx={22} cy={28} r={2} fill="#10b981" opacity={0.5} />
      <Circle cx={98} cy={34} r={1.5} fill="#10b981" opacity={0.4} />
      <Path d="M88 73l2.5 2.5 4-4" stroke="#10b981" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

/* ------------------------------------------------------------------ */
/* 2. Legal — scales of justice with magnifying glass                   */
/* ------------------------------------------------------------------ */
export function LegalIllustration({ style, size = 120 }: IllustrationProps) {
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} style={style}>
      <Rect x={58} y={28} width={4} height={56} rx={2} fill="#0ea5e9" opacity={0.3} />
      <Rect x={44} y={82} width={32} height={6} rx={3} fill="#0ea5e9" opacity={0.2} />
      <Rect x={24} y={26} width={72} height={4} rx={2} fill="#0ea5e9" />
      <Path d="M24 30 L16 54 L32 54 Z" fill="#0ea5e9" opacity={0.15} stroke="#0ea5e9" strokeWidth={1.5} />
      <Ellipse cx={24} cy={55} rx={10} ry={3} fill="#0ea5e9" opacity={0.2} stroke="#0ea5e9" strokeWidth={1} />
      <Path d="M96 30 L88 50 L104 50 Z" fill="#0ea5e9" opacity={0.15} stroke="#0ea5e9" strokeWidth={1.5} />
      <Ellipse cx={96} cy={51} rx={10} ry={3} fill="#0ea5e9" opacity={0.2} stroke="#0ea5e9" strokeWidth={1} />
      <Line x1={24} y1={28} x2={24} y2={30} stroke="#0ea5e9" strokeWidth={1.5} />
      <Line x1={96} y1={28} x2={96} y2={30} stroke="#0ea5e9" strokeWidth={1.5} />
      <Circle cx={38} cy={70} r={10} fill="none" stroke="#0ea5e9" strokeWidth={2} />
      <Line x1={45} y1={77} x2={52} y2={84} stroke="#0ea5e9" strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={38} cy={70} r={10} fill="#0ea5e9" opacity={0.08} />
      <Circle cx={34} cy={66} r={2} fill="#0ea5e9" opacity={0.4} />
      <Rect x={20} y={44} width={8} height={6} rx={1} fill="#0ea5e9" opacity={0.3} />
      <Line x1={22} y1={46} x2={26} y2={46} stroke="#0ea5e9" strokeWidth={0.8} opacity={0.5} />
      <Line x1={22} y1={48} x2={25} y2={48} stroke="#0ea5e9" strokeWidth={0.8} opacity={0.5} />
      <Circle cx={60} cy={24} r={4} fill="#0ea5e9" opacity={0.2} stroke="#0ea5e9" strokeWidth={1.5} />
    </Svg>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Valuation — chart trending up with sparkles                      */
/* ------------------------------------------------------------------ */
export function ValuationIllustration({ style, size = 120 }: IllustrationProps) {
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} style={style}>
      <Rect x={20} y={20} width={80} height={70} rx={6} fill="#f59e0b" opacity={0.06} />
      <Line x1={28} y1={84} x2={96} y2={84} stroke="#f59e0b" strokeWidth={1.5} opacity={0.3} />
      <Line x1={28} y1={84} x2={28} y2={24} stroke="#f59e0b" strokeWidth={1.5} opacity={0.3} />
      <Polyline
        points="32,76 44,68 52,72 62,54 72,46 80,36 92,28"
        stroke="#f59e0b"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Polygon points="32,76 44,68 52,72 62,54 72,46 80,36 92,28 92,84 32,84" fill="#f59e0b" opacity={0.1} />
      <Circle cx={32} cy={76} r={3} fill="#1e293b" stroke="#f59e0b" strokeWidth={1.5} />
      <Circle cx={52} cy={72} r={3} fill="#1e293b" stroke="#f59e0b" strokeWidth={1.5} />
      <Circle cx={72} cy={46} r={3} fill="#1e293b" stroke="#f59e0b" strokeWidth={1.5} />
      <Circle cx={92} cy={28} r={3} fill="#1e293b" stroke="#f59e0b" strokeWidth={1.5} />
      <Path d="M96 22l2-4 2 4-4 2 4 2-2 4-2-4-4-2z" fill="#f59e0b" opacity={0.7} />
      <Path d="M84 18l1.5-3 1.5 3-3 1.5 3 1.5-1.5 3-1.5-3-3-1.5z" fill="#f59e0b" opacity={0.5} />
      <Path d="M88 24l4 4 4-8" stroke="#f59e0b" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Rect x={34} y={90} width={8} height={4} rx={1} fill="#f59e0b" opacity={0.2} />
      <Rect x={50} y={90} width={8} height={4} rx={1} fill="#f59e0b" opacity={0.3} />
      <Rect x={66} y={90} width={8} height={4} rx={1} fill="#f59e0b" opacity={0.4} />
      <Rect x={82} y={90} width={8} height={4} rx={1} fill="#f59e0b" opacity={0.6} />
    </Svg>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Location — map pin with radiating rings                          */
/* ------------------------------------------------------------------ */
export function LocationIllustration({ style, size = 120 }: IllustrationProps) {
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} style={style}>
      <Circle cx={60} cy={50} r={40} stroke="#d946ef" strokeWidth={1} opacity={0.1} />
      <Circle cx={60} cy={50} r={28} stroke="#d946ef" strokeWidth={1} opacity={0.15} />
      <Circle cx={60} cy={50} r={18} stroke="#d946ef" strokeWidth={1.5} opacity={0.2} />
      <Rect x={24} y={30} width={72} height={50} rx={6} fill="#d946ef" opacity={0.06} />
      <Line x1={24} y1={45} x2={96} y2={45} stroke="#d946ef" strokeWidth={0.5} opacity={0.1} />
      <Line x1={24} y1={60} x2={96} y2={60} stroke="#d946ef" strokeWidth={0.5} opacity={0.1} />
      <Line x1={48} y1={30} x2={48} y2={80} stroke="#d946ef" strokeWidth={0.5} opacity={0.1} />
      <Line x1={72} y1={30} x2={72} y2={80} stroke="#d946ef" strokeWidth={0.5} opacity={0.1} />
      <Path d="M60 22c-10 0-18 8-18 18s18 28 18 28 18-18 18-28-8-18-18-18z" fill="#d946ef" opacity={0.2} stroke="#d946ef" strokeWidth={2} />
      <Circle cx={60} cy={40} r={7} fill="#d946ef" opacity={0.3} stroke="#d946ef" strokeWidth={1.5} />
      <Circle cx={60} cy={40} r={3} fill="#d946ef" />
      <Ellipse cx={60} cy={74} rx={12} ry={3} fill="#d946ef" opacity={0.15} />
      <Path d="M30 75l20-10 20 5 20-8" stroke="#d946ef" strokeWidth={1} opacity={0.2} strokeDasharray="3 3" />
      <Rect x={70} y={84} width={24} height={12} rx={3} fill="#d946ef" opacity={0.12} stroke="#d946ef" strokeWidth={1} />
      <SvgText x={82} y={93} textAnchor="middle" fill="#d946ef" fontSize={7} fontWeight="bold" opacity={0.6}>
        ZONE
      </SvgText>
    </Svg>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Property — building with construction crane                      */
/* ------------------------------------------------------------------ */
export function PropertyIllustration({ style, size = 120 }: IllustrationProps) {
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} style={style}>
      <Rect x={10} y={88} width={100} height={8} rx={4} fill="#3b82f6" opacity={0.1} />
      <Rect x={36} y={38} width={34} height={50} rx={3} fill="#3b82f6" opacity={0.12} stroke="#3b82f6" strokeWidth={1.5} />
      <Rect x={42} y={44} width={8} height={6} rx={1} fill="#3b82f6" opacity={0.3} />
      <Rect x={56} y={44} width={8} height={6} rx={1} fill="#3b82f6" opacity={0.3} />
      <Rect x={42} y={56} width={8} height={6} rx={1} fill="#3b82f6" opacity={0.25} />
      <Rect x={56} y={56} width={8} height={6} rx={1} fill="#3b82f6" opacity={0.25} />
      <Rect x={42} y={68} width={8} height={6} rx={1} fill="#3b82f6" opacity={0.2} />
      <Rect x={56} y={68} width={8} height={6} rx={1} fill="#3b82f6" opacity={0.2} />
      <Rect x={49} y={78} width={8} height={10} rx={1.5} fill="#3b82f6" opacity={0.35} />
      <Rect x={80} y={18} width={3} height={70} rx={1} fill="#3b82f6" opacity={0.25} />
      <Rect x={72} y={16} width={28} height={3} rx={1} fill="#3b82f6" opacity={0.3} />
      <Line x1={83} y1={19} x2={98} y2={16} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
      <Line x1={83} y1={19} x2={72} y2={16} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
      <Line x1={74} y1={19} x2={74} y2={34} stroke="#3b82f6" strokeWidth={1} opacity={0.25} strokeDasharray="2 2" />
      <Path d="M71 34c0-2 6-2 6 0" stroke="#3b82f6" strokeWidth={1.5} opacity={0.4} />
      <Rect x={72} y={36} width={4} height={4} rx={0.5} fill="#3b82f6" opacity={0.2} />
      <Rect x={14} y={62} width={18} height={26} rx={2} fill="#3b82f6" opacity={0.08} stroke="#3b82f6" strokeWidth={1} />
      <Rect x={18} y={68} width={4} height={4} rx={0.5} fill="#3b82f6" opacity={0.2} />
      <Rect x={24} y={68} width={4} height={4} rx={0.5} fill="#3b82f6" opacity={0.2} />
      <Line x1={36} y1={92} x2={70} y2={92} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
      <Line x1={36} y1={90} x2={36} y2={94} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
      <Line x1={70} y1={90} x2={70} y2={94} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
      <SvgText x={53} y={98} textAnchor="middle" fill="#3b82f6" fontSize={6} opacity={0.4}>
        SQFT
      </SvgText>
    </Svg>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Security — padlock fused with a shield                           */
/* ------------------------------------------------------------------ */
export function SecurityIllustration({ style, size = 120 }: IllustrationProps) {
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} style={style}>
      <Path d="M60 14L28 30v26c0 22 14 40 32 48 18-8 32-26 32-48V30L60 14z" fill="#f43f5e" opacity={0.08} stroke="#f43f5e" strokeWidth={2} />
      <Path d="M60 24L38 36v20c0 16 10 30 22 36 12-6 22-20 22-36V36L60 24z" fill="#f43f5e" opacity={0.06} />
      <Rect x={46} y={50} width={28} height={22} rx={4} fill="#f43f5e" opacity={0.15} stroke="#f43f5e" strokeWidth={2} />
      <Path d="M50 50V42c0-5.5 4.5-10 10-10s10 4.5 10 10v8" stroke="#f43f5e" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      <Circle cx={60} cy={58} r={4} fill="#f43f5e" opacity={0.4} />
      <Rect x={58.5} y={60} width={3} height={6} rx={1} fill="#f43f5e" opacity={0.4} />
      <Circle cx={60} cy={58} r={2} fill="#f43f5e" opacity={0.7} />
      <Path d="M52 82l5 5 11-11" stroke="#f43f5e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
      <Circle cx={28} cy={30} r={2} fill="#f43f5e" opacity={0.3} />
      <Circle cx={92} cy={30} r={2} fill="#f43f5e" opacity={0.3} />
      <Path d="M22 60c4-2 8 2 12 0" stroke="#f43f5e" strokeWidth={1} opacity={0.2} />
      <Path d="M86 60c4-2 8 2 12 0" stroke="#f43f5e" strokeWidth={1} opacity={0.2} />
    </Svg>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Exit — door opening with an arrow                                */
/* ------------------------------------------------------------------ */
export function ExitIllustration({ style, size = 120 }: IllustrationProps) {
  return (
    <Svg viewBox="0 0 120 120" width={size} height={size} style={style}>
      <Rect x={16} y={22} width={56} height={72} rx={4} fill="#8b5cf6" opacity={0.06} />
      <Rect x={42} y={26} width={34} height={64} rx={3} fill="none" stroke="#8b5cf6" strokeWidth={2} />
      <Path d="M76 26L92 36v48L76 90V26z" fill="#8b5cf6" opacity={0.12} stroke="#8b5cf6" strokeWidth={1.5} />
      <Circle cx={73} cy={58} r={2.5} fill="#8b5cf6" opacity={0.4} />
      <Polygon points="76,34 100,42 100,78 76,84" fill="#8b5cf6" opacity={0.06} />
      <Polygon points="76,40 96,46 96,72 76,78" fill="#8b5cf6" opacity={0.04} />
      <Path d="M82 58h24" stroke="#8b5cf6" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
      <Path d="M100 52l6 6-6 6" stroke="#8b5cf6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <Circle cx={32} cy={44} r={5} fill="#8b5cf6" opacity={0.2} />
      <Line x1={32} y1={49} x2={32} y2={64} stroke="#8b5cf6" strokeWidth={2} opacity={0.2} />
      <Line x1={32} y1={56} x2={26} y2={52} stroke="#8b5cf6" strokeWidth={1.5} opacity={0.2} />
      <Line x1={32} y1={56} x2={38} y2={52} stroke="#8b5cf6" strokeWidth={1.5} opacity={0.2} />
      <Line x1={32} y1={64} x2={27} y2={74} stroke="#8b5cf6" strokeWidth={1.5} opacity={0.2} />
      <Line x1={32} y1={64} x2={37} y2={74} stroke="#8b5cf6" strokeWidth={1.5} opacity={0.2} />
      <Circle cx={24} cy={28} r={7} fill="none" stroke="#8b5cf6" strokeWidth={1.5} opacity={0.25} />
      <Line x1={24} y1={28} x2={24} y2={24} stroke="#8b5cf6" strokeWidth={1.5} opacity={0.3} />
      <Line x1={24} y1={28} x2={27} y2={30} stroke="#8b5cf6" strokeWidth={1.5} opacity={0.3} />
      <Rect x={48} y={18} width={22} height={8} rx={2} fill="#8b5cf6" opacity={0.1} />
      <SvgText x={59} y={25} textAnchor="middle" fill="#8b5cf6" fontSize={6} fontWeight="bold" opacity={0.4}>
        EXIT
      </SvgText>
    </Svg>
  )
}

/* ------------------------------------------------------------------ */
/* Lookup map for the carousel                                         */
/* ------------------------------------------------------------------ */
const ILLUSTRATION_MAP: Record<string, React.FC<IllustrationProps>> = {
  builder: BuilderIllustration,
  legal: LegalIllustration,
  valuation: ValuationIllustration,
  location: LocationIllustration,
  property: PropertyIllustration,
  security: SecurityIllustration,
  exit: ExitIllustration,
}

export function illustrationForCategory(code: string): React.FC<IllustrationProps> {
  return ILLUSTRATION_MAP[code] ?? BuilderIllustration
}
