import { apiRequest, internalResponse } from "./api"
import { form } from "./global"

async function checkDNS(customFetch: typeof fetch, constituentId: string): Promise<TessPerformanceResponse> {
    const constituents = await apiRequest<Array<Constituent>>(`CRM/Constituencies?constituentId=${constituentId}`, customFetch, "GET") //342957 DNS
    if (!constituents) {
        return internalResponse(false, {textContext: `Constituent Not Found ---> ${constituentId}`})
    } else {
        let dnsFilter = constituents.filter(constituent => constituent["ConstituencyType"]["ShortDescription"] == "DNS")
        if (dnsFilter.length > 0) {
            return internalResponse(false, {textContext: "DNS issue"})
        } else {
            console.log("ID checked for DNS")
            return internalResponse(true, {id: constituentId})
        }
    }
}

async function createConstituent(customFetch: typeof fetch, sessionKey: string): Promise<TessPerformanceResponse> {
    let constituent = {
        ConstituentTypeId: 1,
        LastName: form.lastName,
        FirstName: form.firstName,
        OriginalSourceId: 5,
        PrimaryElectronicAddress: {
            Address: form.email
        },
        WebLogin: {
            LoginTypeId: 1,
            Password: "Th15154NEWUZ3r&*TUBBYWUZHERe@#%@$#%^FASF"
        }
    }
    const constituentCall = await apiRequest<Record<string, any>>(`Web/Registration/${sessionKey}/Register`, customFetch, "POST", constituent)
    
    if (!constituentCall) {
        return internalResponse(false, {textContext: `Account Creation Failure ---> ${form.email}`})
    }
    console.log("constituent created")
    return internalResponse(true, {id: constituentCall["LoginInfo"]["ConstituentId"]})
}

export async function getConstituentId(customFetch: typeof fetch, sessionKey: string): Promise<TessPerformanceResponse> {
    let constituentSummary = await apiRequest<Record<string, Array<ConstituentSummary>>>(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}&atype=Web%20Login`, customFetch)
    let constituentArray = constituentSummary !== null ?  constituentSummary["ConstituentSummaries"] : []

    if (constituentArray.length !== 1) {
        const constituentAllEmails = await apiRequest<Record<string, Array<ConstituentSummary>>>(`CRM/Constituents/Search?type=advanced&atype=Email&op=Like&value=%${form.email}`, customFetch)
        if (!constituentAllEmails) {
            return internalResponse(false, {textContext: `No constituent ID found ---> ${form.email}`})
        }
        constituentArray = constituentAllEmails["ConstituentSummaries"].filter(constituent => constituent["Inactive"] == true)
        if (constituentArray.length == 0) {
            return createConstituent(customFetch, sessionKey)
        } else if (constituentArray.length > 1) {
            return internalResponse(false, {textContext: `No constituent ID found ---> ${form.email}`})
        }
    }

    return checkDNS(customFetch, constituentArray[0].Id)
}