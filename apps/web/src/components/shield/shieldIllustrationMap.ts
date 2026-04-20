import type { IllustrationProps } from './ShieldIllustrations'
import {
  BuilderIllustration,
  LegalIllustration,
  ValuationIllustration,
  LocationIllustration,
  PropertyIllustration,
  SecurityIllustration,
  ExitIllustration,
} from './ShieldIllustrations'

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
