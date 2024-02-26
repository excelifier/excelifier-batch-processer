import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

const DIR_OUT = process.env.DIR_OUT!;
const BEARER_TOKEN = process.env.BEARER_TOKEN!;

interface JobStatus {
    uuid: string;
    created_at: string;
    success: boolean;
    filename: string;
    pages: number;
    processing: boolean;
    price: number;
    type: string;
    ocr: boolean;
    deleted: boolean;
}


const getDirectories = (srcPath: string): string[] =>
    fs.readdirSync(srcPath).filter((file) => fs.statSync(path.join(srcPath, file)).isDirectory());

const fetchJobStatus = async (uuid: string): Promise<JobStatus | null> => {
    const url = `https://api.excelifier.com/job/${uuid}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
            },
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: JobStatus = await response.json() as JobStatus;
        return data;
    } catch (error) {
        console.error(`Error fetching job status for UUID ${uuid}:`, error);
        return null;
    }
};

const saveResultToFile = async (uuid: string, filename: string, data: object): Promise<void> => {
    const filePath = path.join(DIR_OUT, `${filename}.json`);
    try {
        await fse.outputJson(filePath, data, { spaces: 2 });
        console.log(`Saved result for ${uuid} as ${filePath}`);
    } catch (error) {
        console.error(`Error saving result for ${uuid}:`, error);
    }
};

const deleteUUIDDirectory = async (uuid: string): Promise<void> => {
    try {
        await fse.remove(path.join(DIR_OUT, uuid));
        console.log(`Deleted directory for UUID: ${uuid}`);
    } catch (error) {
        console.error(`Error deleting directory for UUID ${uuid}:`, error);
    }
};

const processResults = async (): Promise<void> => {
    console.log("Starting to process results");
    const uuidDirectories = getDirectories(DIR_OUT);
    console.log(`Currently ${uuidDirectories.length} results to process`);

    for (const uuid of uuidDirectories) {
        console.log(`Processing ${uuid}`);
        const jobStatus = await fetchJobStatus(uuid);

        if (jobStatus && jobStatus.success) {
            console.log(`Job ${uuid} is successful, let's fetch it`);
            const result = await fetch(`https://api.excelifier.com/job/${uuid}/result/json`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                },
            }).then((res) => res.json()) as object;

            await saveResultToFile(uuid, jobStatus.filename, result);
            await deleteUUIDDirectory(uuid);
        } else {
            console.log(`Job ${uuid} is not ready or failed.`);
        }
    }

};

export default processResults;
