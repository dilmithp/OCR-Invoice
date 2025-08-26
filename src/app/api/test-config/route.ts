// Create: src/app/api/test-config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    const config = {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.GOOGLE_CLOUD_LOCATION,
        processorId: process.env.GOOGLE_CLOUD_PROCESSOR_ID,
        credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    };

    const processorName = `projects/${config.projectId}/locations/${config.location}/processors/${config.processorId}`;

    return NextResponse.json({
        message: 'Document AI configuration',
        config: {
            ...config,
            credentialsPath: config.credentialsPath ? 'Configured' : 'Missing',
        },
        processorName,
        endpointUrl: `https://us-documentai.googleapis.com/v1/${processorName}:process`,
    });
}
