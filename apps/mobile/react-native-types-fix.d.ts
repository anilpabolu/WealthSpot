/**
 * Bridge React 18/19 type mismatch in npm workspaces monorepo.
 *
 * react-native is hoisted to root node_modules and resolves
 * @types/react@19 (where ReactNode includes `bigint`).
 * Mobile code resolves the local @types/react@18.3 (no `bigint`).
 *
 * Augmenting the experimental interface adds `bigint` to the
 * local ReactNode definition so both sides agree.
 */
import "react";

declare module "react" {
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES {
    bigint: bigint;
  }
}
