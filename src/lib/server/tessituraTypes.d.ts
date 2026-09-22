

declare global {
    // performance
    type TessBoolean = "Y" | "N"
    interface TessSeason {
        StartDateTime: string,
        EndDateTime: string,
        Id: string,
    }
    interface ProductionSeason {
        Id: string,
        Production: {
            Description: string
        }
    }
    interface TessPerformance {
        Id: string,
        AvailSaleIndicator: boolean,
        Date: string
    }
    interface TessPerformanceResponse {
        ok: boolean,
        errorMessage: string,
        data?: any
    }
    interface PerformancePrices {
        Id: string,
        Enabled: boolean,
        ZoneId: string
    }
    interface TessPriceType {
        PriceTypeId: string,
        BaseIndicator: boolean,
        PerformancePrices: Array<Record<string, PerformancePrices>>,
        TicketDesignId: string
    }
    // transaction
    interface ConstituentSummary {
        Inactive: TessBoolean,
        Id: string
    }
    interface Constituent {
        ConstituencyType: {
            ShortDescription: string
        }
    }
}

export {}