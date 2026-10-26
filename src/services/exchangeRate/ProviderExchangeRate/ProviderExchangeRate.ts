import { ExchangeRateSimple } from '../../../models/ExchangeRate'

export interface ProviderExchange {
    type: string;
    id: string;
}
export interface ProviderExchangeRate extends ProviderExchange, ExchangeRateSimple {}