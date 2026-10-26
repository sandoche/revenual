import { AccountSimple } from '../../../models/Account'

export interface Validable {
    isValid: boolean;
    _id: any;
    validate(): void;
}

export interface Refreshable {
    refreshToken(): void;
}

export interface ValidableAccount extends AccountSimple, Validable {}
export interface RefreshableAccount extends AccountSimple, Refreshable {}