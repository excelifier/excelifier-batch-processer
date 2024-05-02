import fs from "fs";
import path from "path";
import fse from "fs-extra";
import config from "./env";

interface PostJobResponse {
  status: string;
  uuid: string;
}

const getFiles = async (dir: string, ext: string): Promise<string[]> =>
  fs.readdirSync(dir).filter((file) => file.endsWith(ext));

const processFiles = async (): Promise<void> => {
  console.log(`Starting to process files`);
  const files = await getFiles(`${config.dirIn}/`, ".pdf");
  console.log(`Currently ${files.length} files to process`);

  for (const file of files) {
    console.log(`About to send file ${file}`);
    const filePath = path.join(config.dirIn, file);
    const data = fs.readFileSync(filePath);
    const base64Data = data.toString("base64");

    try {
      type BodyContent = {
        file: string;
        filename: string;
        notify: string | null;
        org_id: string;
        ocr?: boolean;
        language?: string;
        schema?: string;
      };
      const bodyContent: BodyContent = {
        file: base64Data,
        filename: file,
        notify: config.notifyEmail || null,
        org_id: config.orgId,
      };

      // Add OCR and language only if OCR is enabled
      if (config.ocr) {
        bodyContent.ocr = true;
        bodyContent.language = config.ocrLang;
      }

      if (config.schemaUuid) {
        bodyContent.schema = config.schemaUuid;
      }

      const response = await fetch(`${config.apiHost}/job`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.bearerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyContent),
      });

      if (response.ok) {
        const data: PostJobResponse =
          (await response.json()) as PostJobResponse;
        const uuid = data.uuid;
        console.log(`Got uuid from Excelifier: ${uuid}`);
        const outputDir = path.join(config.dirOut, uuid);
        await fse.ensureDir(outputDir);

        const processedDir = path.join(config.dirIn, "Processed");
        await fse.ensureDir(processedDir);
        await fse.move(filePath, path.join(processedDir, file));
        console.log(`Moved ${file} to ${processedDir}`);
      } else {
        const respText = await response.text();
        console.error("Response", respText);
        console.error("Failed to process file:", file);
      }
    } catch (error) {
      console.error("Error processing file:", file, error);
    }
  }
};

export default processFiles;
