import { AccountSimple } from '../../../models/Account'

export interface Reportable {
    download(): void;
    reportData: string;
    year: number;
    month: number;
    _id: string;
}

export interface ReportableAccount extends AccountSimple, Reportable {}