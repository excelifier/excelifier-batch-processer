import fs from 'fs';
import path from 'path';
import fse from 'fs-extra';
import dotenv from 'dotenv';

dotenv.config();

const DIR_IN = process.env.DIR_IN!;
const DIR_OUT = process.env.DIR_OUT!;
const BEARER_TOKEN = process.env.BEARER_TOKEN!;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

interface PostJobResponse {
    status: string;
    uuid: string;
}

const getFiles = async (dir: string, ext: string): Promise<string[]> =>
    fs.readdirSync(dir).filter((file) => file.endsWith(ext));

const processFiles = async (): Promise<void> => {
    console.log(`Starting to process files`);
    const files = await getFiles(`${DIR_IN}/`, '.pdf');
    console.log(`Currently ${files.length} files to process`);

    for (const file of files) {
        console.log(`About to send file ${file}`);
        const filePath = path.join(DIR_IN, file);
        const data = fs.readFileSync(filePath);
        const base64Data = data.toString('base64');

        try {
            const response = await fetch('https://api.excelifier.com/job', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${BEARER_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file: base64Data,
                    filename: file,
                    notify: NOTIFY_EMAIL,
                }),
            });

            if (response.ok) {
                const data: PostJobResponse = await response.json() as PostJobResponse;
                const uuid = data.uuid;
                console.log(`Got uuid from Excelifier: ${uuid}`);
                const outputDir = path.join(DIR_OUT, uuid);
                await fse.ensureDir(outputDir);

                const processedDir = path.join(DIR_IN, 'Processed');
                await fse.ensureDir(processedDir);
                await fse.move(filePath, path.join(processedDir, file));
                console.log(`Moved ${file} to ${processedDir}`);
            } else {
                console.error('Failed to process file:', file);
            }
        } catch (error) {
            console.error('Error processing file:', file, error);
        }
    }
};

export default processFiles;
