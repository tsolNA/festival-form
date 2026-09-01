

declare global {
    type TessBoolean = "Y" | "N"
    interface TessSeason {
        StartDateTime: string,
        EndDateTime: string,
        Id: string,
    }
    interface ProductionSeason {
        Id: number,
        Production: {
            Description: string
        }
    }
    interface TessPerformance {
        AvailSaleIndicator: boolean,
        Date: string,
        Id: string
    }
    interface PerformancePrices {
        Enabled: boolean,
        ZoneId: number
    }
    interface TessPriceType {
        PriceTypeId: number
        BaseIndicator: boolean,
        PerformancePrices: Array<Record<string, PerformancePrices>>
    }
}

export {}