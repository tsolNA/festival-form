

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
        textContext: string,
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
        PerformancePrices: Array<PerformancePrices>,
        TicketDesignId: string
    }
    // transaction
    interface ConstituentSummary {
        Inactive: boolean,
        Id: string
    }
    interface Constituent {
        ConstituencyType: {
            ShortDescription: string
        }
    }

    interface ContactPermissionTypes {
        Description: string,
        Category: {
            Description: string
        }
    }
    interface ContactPermissions {
        UpdatedDateTime: string
        Id: string,
        Answer: TessBoolean
        Type: {
            Description: string
            Category: {
                Description: string
            }
        },
    }

    interface CartProps {
        ModeOfSaleId: number,
        SourceId: number,
        Solicitor: string,
        CategoryId: number,
        ChannelId: number,
        HoldUntilDateTime: string,
        Notes: string,
        InitiatorId: number,
        AddressId: number,
        ElectronicAddressId: string,
        PhoneId: number,
        DeliveryMethodId: number,
        OrderDateTime: string,
        OrderConfirmationFormatId: number
    }
    interface EmailResponse {
        ElectronicAddressType: {
            Id: string
        }
        Address: string,
        AffiliatedConstituent: {
            Id: string
        },
        Id: string,
        Inactive: boolean
    }
    interface Order {
        Id: string
    }
}

export {}