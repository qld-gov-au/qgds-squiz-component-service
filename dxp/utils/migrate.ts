// SITE-WIDE CCT TO DXP COMPONENT MIGRATION ENGINE
// Blockquote test


//INTERFACES

interface AppConfig {
    MATRIX_API_ENDPOINT: string;
    API_BEARER_TOKEN: string;
    ROOT_SITE_ID: string;
    CCT_SCHEMA_ID: string;
}

interface LegacyCctFields {
    value: string;
}

interface LegacyCctBlock {
    [fieldName: string]: LegacyCctFields | undefined;
}

interface MatrixMetadataResponse {
    [schemaId: string]: LegacyCctBlock | undefined;
}

interface LineageResponse {
    [assetId: string]: any;
}

interface MatrixApiError {
    error?: string;
}

// Structured to align 1:1 with the DXP manifest input schema rules
interface DxpBlockquotePayload {
    content: string;
    citation: {
        "cite-text": string;
        "citeUrl": string;
        "citeUrlClickable": "yes" | "no";
    };
}


// RUNTIME ENVIRONMENT CONFIGURATION
const CONFIG: AppConfig = {
    MATRIX_API_ENDPOINT: 'MATRIX_API_ENDPOINT',
    API_BEARER_TOKEN: 'MATRIX_REST_API_TOKEN',
    ROOT_SITE_ID: '650142',
    CCT_SCHEMA_ID: '113168'
};

// Global definition for consistent Matrix content API communication headers
const fetchHeaders = {
    'Authorization': `Bearer ${CONFIG.API_BEARER_TOKEN}`,
    'Content-Type': 'application/json'
};

//Shared helper to manage native fetch POST requests and reduce boilerplate

async function apiPost<T>(path: string, body: object): Promise<T> {
    // Sanitise trailing/leading slashes to prevent broken URL construction
    const cleanBase = CONFIG.MATRIX_API_ENDPOINT.replace(/\/$/, '');
    const cleanPath = path.replace(/^\//, '');
    
    const response = await fetch(`${cleanBase}/${cleanPath}`, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
}

// Main execution thread to sweep the site hierarchy and batch update components
async function runSiteWideMigration(): Promise<void> {
    try {
        console.log(`🔍 Fetching structure underneath root asset #${CONFIG.ROOT_SITE_ID}...`);

        // Pulling content container assets down the branch
        const lineageData = await apiPost<LineageResponse & MatrixApiError>('/getLineage', {
              asset_id: CONFIG.ROOT_SITE_ID,
              types: ['content_type_container']
          });

        if (!lineageData || lineageData.error) {
            throw new Error(lineageData?.error || 'Failed to retrieve valid lineage payload.');
        }

        const assetQueue: string[] = Object.keys(lineageData);
        console.log(`📋 Identified ${assetQueue.length} layout nodes. Scanning for blockquote CCT matches...`);

        let migratedCount: number = 0;
        let skippedCount: number = 0;

        // Process sequentially to throttle network overhead and respect connection limits
        for (const currentAssetId of assetQueue) {
            const wasMigrated: boolean = await processIndividualAsset(currentAssetId);
            if (wasMigrated) {
                migratedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`\n🏁 MIGRATION PROCESS COMPLETE`);
        console.log(`👉 Upgraded Assets: ${migratedCount}`);
        console.log(`👉 Ignored Assets: ${skippedCount}`);

    } catch (error: any) {
        console.error(`💥 Critical process termination:`, error.message);
        throw new Error('Migration run aborted due to a critical system failure.');
    }
}

// Checks layout schema bindings and translates block payloads to DXP component JSON structures
async function processIndividualAsset(assetId: string): Promise<boolean> {
    try {
        const metadata = await apiPost<MatrixMetadataResponse>('/getMetadata', { asset_id: assetId });

        // Exit immediately if the container is not bound to the blockquote CCT schema
        if (!metadata || !metadata[CONFIG.CCT_SCHEMA_ID]) {
            return false;
        }

        const legacyCctBlock = metadata[CONFIG.CCT_SCHEMA_ID];
        if (!legacyCctBlock) return false;
        
        // Map raw strings out of the legacy schema payload fields
        const contentVal: string = legacyCctBlock['content']?.value || '';
        const citeTextVal: string = legacyCctBlock['cite-text']?.value || '';
        const citeUrlVal: string = legacyCctBlock['citeUrl']?.value || '';
        
        // Validate enum constraint for clickable field
        const rawClickable: string = legacyCctBlock['citeUrlClickable']?.value || 'no';
        const citeUrlClickableVal: "yes" | "no" = rawClickable === 'yes' ? 'yes' : 'no';

        // Ignore empty blocks to prevent rendering broken components on the frontend
        if (!contentVal || contentVal.trim() === "") {
            console.log(`⚠️  Skipped asset #${assetId}: Root quote text field is empty.`);
            return false;
        }

        console.log(`🎯 Match found: Upgrading blockquote CCT instance on asset #${assetId}`);

        // Strongly typed payload matching the DXP manifest specifications
        const dxpPayload: DxpBlockquotePayload = {
            content: contentVal,
            citation: {
                "cite-text": citeTextVal,
                "citeUrl": citeUrlVal,
                "citeUrlClickable": citeUrlClickableVal
            }
        };

        // Write the decoupled parameter data payload directly into the Matrix core asset
        const updateData = await apiPost<MatrixApiError>('/setParameters', {
            asset_id: assetId,
            parameters: {
                'component_data': JSON.stringify(dxpPayload)
            }
        });

        if (updateData && updateData.error) {
            console.error(`❌ API validation error writing parameters to asset #${assetId}:`, updateData.error);
            return false;
        }

        console.log(`   ✅ Asset #${assetId} layout definitions successfully converted to DXP format.`);
        return true;

    } catch (nodeError: any) {
        console.error(`❌ Connection failure processing asset #${assetId}:`, nodeError.message);
        return false;
    }
}

runSiteWideMigration();