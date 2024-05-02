import fs from "fs";
import path from "path";
import fse from "fs-extra";
import { z } from "zod";
import config from "./env";
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
  fail_reason: string;
}

const getDirectories = (srcPath: string): string[] =>
  fs
    .readdirSync(srcPath)
    .filter((file) => fs.statSync(path.join(srcPath, file)).isDirectory());

const fetchJobStatus = async (uuid: string): Promise<JobStatus | null> => {
  const url = `${config.apiHost}/job/${uuid}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.bearerToken}`,
      },
    });
    //console.log("resp", await response.text());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: JobStatus = (await response.json()) as JobStatus;
    return data;
  } catch (error) {
    console.error(`Error fetching job status for UUID ${uuid}:`, error);
    return null;
  }
};

const saveResultToFile = async (
  uuid: string,
  filename: string,
  data: object
): Promise<void> => {
  const filePath = path.join(config.dirOut, `${filename}.json`);
  try {
    await fse.outputJson(filePath, data, { spaces: 2 });
    console.log(`Saved result for ${uuid} as ${filePath}`);
  } catch (error) {
    console.error(`Error saving result for ${uuid}:`, error);
  }
};

const saveFailedResponseToFile = async (
  uuid: string,
  filename: string,
  data: object
): Promise<void> => {
  const filePath = path.join(`${config.dirOut}/failed/`, `${filename}.json`);
  try {
    await fse.outputJson(filePath, data, { spaces: 2 });
    console.log(`Saved failed response for ${uuid} as ${filePath}`);
  } catch (error) {
    console.error(`Error saving failed response for ${uuid}:`, error);
  }
};

const deleteUUIDDirectory = async (uuid: string): Promise<void> => {
  try {
    await fse.remove(path.join(config.dirOut, uuid));
    console.log(`Deleted directory for UUID: ${uuid}`);
  } catch (error) {
    console.error(`Error deleting directory for UUID ${uuid}:`, error);
  }
};

const processResults = async (): Promise<void> => {
  console.log("Starting to process results");

  const uuidSchema = z.string().uuid();
  const uuidDirectories = getDirectories(config.dirOut).filter(
    (dir) => uuidSchema.safeParse(dir).success
  );

  console.log(`Currently ${uuidDirectories.length} results to process`);

  for (const uuid of uuidDirectories) {
    console.log(`Processing ${uuid}`);
    const jobStatus = await fetchJobStatus(uuid);

    if (jobStatus && jobStatus.success) {
      console.log(`Job ${uuid} is successful, let's fetch it`);
      const result = (await fetch(`${config.apiHost}/job/${uuid}/result/json`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.bearerToken}`,
        },
      }).then((res) => res.json())) as object;

      await saveResultToFile(uuid, jobStatus.filename, result);
      await deleteUUIDDirectory(uuid);
    }
    if (jobStatus && !jobStatus.processing && jobStatus.fail_reason) {
      console.log(`Failed: ${jobStatus?.fail_reason}`);
      await saveFailedResponseToFile(uuid, jobStatus.filename, jobStatus);
      await deleteUUIDDirectory(uuid);
    } else {
      console.log(jobStatus);
      console.log(`Job ${uuid} is not ready or failed.`);
    }
  }
};

export default processResults;
