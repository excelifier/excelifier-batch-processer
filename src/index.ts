import dotenv from 'dotenv';
import processFiles from './processFiles.js';
import processResults from './processResults.js';
import fse from 'fs-extra';

// Load environment variables
dotenv.config();

const DIR_IN = process.env.DIR_IN!;
const DIR_OUT = process.env.DIR_OUT!;
const PROCESS_INTERVAL = process.env.PROCESS_INTERVAL ? parseInt(process.env.PROCESS_INTERVAL) : 0;

const startProcessing = async () => {
    // Make sure directories exists (and create if not)
    await fse.ensureDir(DIR_IN);
    await fse.ensureDir(DIR_OUT);
    try {
        console.log('Starting PDF processing and results fetching...');
        while (true) {
            await processFiles();
            await processResults();
            if (PROCESS_INTERVAL > 0) {
                console.log(`Waiting for ${PROCESS_INTERVAL / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, PROCESS_INTERVAL));
            } else {
                console.log(`All done (PROCESS_INTERVAL not set).`);
                process.exit(0);
            }
        }
    } catch (error) {
        console.error('An error occurred while starting the processing tasks:', error);
    }
};

// Start the processing
startProcessing();
