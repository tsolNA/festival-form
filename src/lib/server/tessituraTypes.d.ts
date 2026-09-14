

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
        Id: string
        AvailSaleIndicator: boolean,
        Date: string,
    }
    interface PerformancePrices {
        PerformanceId: string,
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