import { PartytownConfig } from "@builder.io/partytown/integration";
/**
 * Props for `<QwikPartytown/>`, which extends the Partytown Config.
 *
 * https://github.com/BuilderIO/partytown#config
 *
 * @public
 */
export interface PartytownProps extends PartytownConfig {
}
/**
 * @public
 * You can pass setting with props
 */
export declare const QwikPartytown: () => import("@builder.io/qwik").Component<PartytownProps>;