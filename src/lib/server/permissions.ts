import { apiRequest, internalResponse, keepALog } from "./api"
import { form } from "./global"

async function createPermissions(customFetch: typeof fetch, constituentId: string): Promise<TessPerformanceResponse> {
    // create and update one call? CreateORUpdate
    
    let getAllPermissions = await apiRequest<Array<ContactPermissionTypes>>("ReferenceData/ContactPermissionTypes", customFetch)
    if (!getAllPermissions) {
        return internalResponse(false, {textContext: `Contact Permission Type Not Found ---> ${constituentId}`})
    }
    let filteredRecords = getAllPermissions.filter(permissionType => permissionType["Description"] == "Email" && permissionType["Category"]["Description"] == "General")
    if (filteredRecords.length == 1) {
        let requestObject = {
            Answer: form.consent ? "Y" : "N",
            Constituent: {
                Id: constituentId
            },
            Type: {
                Id: 1,
                Description: "Email",
                Category: {
                    Id: 1,
                    Description: "General"
                },
            }
        } 
        let permissions = await apiRequest(`CRM/ContactPermissions`, customFetch, "POST", requestObject)
        if (!permissions) {
            return internalResponse(false, {textContext: `Permissions not created ---> ${constituentId}`})
        }
        console.log("Permissions created")
        return internalResponse(true, {data: permissions})
    } else {
        // keepalog() keep constituent ID and consent choice
        return internalResponse(false, {textContext: `Failed to filter contact permissions to 1 ---> ${constituentId}`})
    }
}

async function contactPermissionsUpdate(customFetch: typeof fetch, constituentId: string, filteredId: string, date: string) {
    let constituentInfo = {
        Answer: form.consent ? "Y" : "N",
        Id: filteredId,
        UpdatedDateTime: date,
        Constituent: {
            Id: constituentId
        },
        Type: {
            Id: 1,
            Description: "Email",
            Category: {
                Id: 1,
                Description: "General"
            },
        }
    }
    let updateRequest = await apiRequest(`CRM/ContactPermissions/${filteredId}`, customFetch, "PUT", constituentInfo)//<--------------
    if (updateRequest) {
        console.log("Permissions updated")
        return internalResponse(true, {data:updateRequest})
    } else {
        // keepalog() keep constituent ID and consent choice
        return internalResponse(false, {textContext: `Could not update permissions ---> ${constituentId} ---- ${form.consent}`})
    }
}

export async function checkContactPermissions(customFetch: typeof fetch, constituentId: string) {
    let constituentContact = await apiRequest<Array<ContactPermissions>>(`CRM/ContactPermissions?constituentId=${constituentId}&includeAffiliations=false&activeOnly=true`, customFetch)
    if (constituentContact) {
        let filterFound = constituentContact.filter(constituent => constituent["Type"]["Description"] == "Email" && constituent["Type"]["Category"]["Description"] == "General")
        if (filterFound.length > 0) {
            if ((filterFound[0]["Answer"] == "Y" || filterFound[0]["Answer"] == null) !== form.consent) {
                // No and No = do nothing
                // Yes and Yes = do nothing
                // No and Yes = update
                // Yes and No = update
                let update = contactPermissionsUpdate(customFetch, constituentId, filterFound[0]["Id"], filterFound[0]["UpdatedDateTime"])
                return update
            }
        } else if (!form.consent){
            let creation = await createPermissions(customFetch, constituentId)
            return creation
        }
        // Logic Check -- if no action needed, don't fail
        console.log("Permissions don't need adjusting")
        return internalResponse(true, {textContext: "no action needed"})
    }
    keepALog(`Failed to find constituent permissions contactId: ${constituentId} -- ${form.email}`)
    return internalResponse(true, {textContext: "Failed to find constituent contact"})
}