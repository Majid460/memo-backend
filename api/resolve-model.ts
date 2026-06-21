import type { VercelRequest, VercelResponse } from '@vercel/node';

const R2_BASE_URL = process.env.R2_BASE_URL ?? '';

const MODELS = {
    LITE: {
        name: 'gemma-1b-lite',
        fileName: 'gemma-1b-lite.task',
        sizeMb: 689,
    },
    STANDARD: {
        name: 'gemma-1b-standard',
        fileName: 'gemma-1b-standard.task',
        sizeMb: 1050,
    },
} as const;

interface HardwareSpecs {
    totalRamMb: number;
    availableStorageMb: number;
}

function selectModelTier(specs: HardwareSpecs): keyof typeof MODELS {
    const { totalRamMb, availableStorageMb } = specs;

    if (totalRamMb >= 6000 && availableStorageMb >= 2000) {
        return 'STANDARD';
    }

    return 'LITE';
}

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    if (!R2_BASE_URL) {
        return res.status(500).json({ error: 'Server misconfigured: R2_BASE_URL not set.' });
    }

    const { totalRamMb, availableStorageMb } = req.body as HardwareSpecs;

    if (typeof totalRamMb !== 'number' || typeof availableStorageMb !== 'number') {
        return res.status(400).json({
            error: 'Missing or invalid fields. Expected: totalRamMb (number), availableStorageMb (number).',
        });
    }

    const tier = selectModelTier({ totalRamMb, availableStorageMb });
    const model = MODELS[tier];

    return res.status(200).json({
        tier,
        modelName: model.name,
        fileName: model.fileName,
        sizeMb: model.sizeMb,
        downloadUrl: `${R2_BASE_URL}/${model.fileName}`,
    });
}