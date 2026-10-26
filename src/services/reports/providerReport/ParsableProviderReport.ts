import { ProviderReportSimple } from '../../../models/ProviderReport'
import { AwilixContainer } from 'awilix'

export interface Parsable {
    currency: string;
    parse(): void;
    container: AwilixContainer;
}

export interface ParsableProviderReport extends ProviderReportSimple, Parsable {}