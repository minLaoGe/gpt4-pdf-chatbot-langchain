import type { NextApiRequest, NextApiResponse } from 'next';

import multer, { Multer } from 'multer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE,DIR } from '@/config/pinecone';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';


import { join } from 'path';
import { promises as fs } from 'fs';
export const config = {
    api: {
        bodyParser: false,  // Disallow body parsing, consume as stream
    },
};


// Set up multer storage engine
const storage = multer.diskStorage({
    destination:  function (_req, _file, cb) {
        cb(null, './pdf'); // Destination folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload: Multer = multer({ storage });
interface NextApiRequestWithMulter extends NextApiRequest {
    file: any;
}

export default async function handler(
    req: NextApiRequestWithMulter,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // This function call will throw an error if anything goes wrong with the upload
    await upload.single('file')(req, res, async (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const { file } = req;

        if (!file || file.mimetype !== 'application/pdf') {
            res.status(400).json({ error: 'File type must be a PDF' });
            return;
        }
        if (!DIR){
           return  res.status(400).json({ error: 'dir Error' });
        }
        deleteFilesInDirectory(DIR);
        const savePath = join(DIR, file.filename);
        await fs.copyFile(file.path, savePath);

        await run(DIR)
        await fs.unlink(file.path); // Delete the temporary file
        return res.status(200).json({ message: 'PDF uploaded and saved' });
    });
}
async function deleteFilesInDirectory(directory: string) {
    const files = await fs.readdir(directory);
    for (const file of files) {
        await fs.unlink(join(directory, file));
    }
}
interface NextApiRequestWithFormidable extends NextApiRequest {
    files: File[];
}
// utils.ts
export function bufferToString(buffer: Buffer): string {
    return buffer.toString('binary');
}


/* Name of directory to retrieve your files from
   Make sure to add your PDF files inside the 'docs' folder
*/
const filePath = 'docs';

 const run = async (filePath:string) => {
    try {
        /*load raw docs from the all files in the directory */
        const directoryLoader = new DirectoryLoader(filePath, {
            '.pdf': (path) => new PDFLoader(path),
        });

        // const loader = new PDFLoader(filePath);
        const rawDocs = await directoryLoader.load();

        /* Split text into chunks */
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const docs = await textSplitter.splitDocuments(rawDocs);
        console.log('split docs', docs);

        console.log('creating vector store...');
        /*create and store the embeddings in the vectorStore*/
        const embeddings = new OpenAIEmbeddings();
        const index = pinecone.Index(PINECONE_INDEX_NAME); //change to your own index name

        //embed the PDF documents
        await PineconeStore.fromDocuments(docs, embeddings, {
            pineconeIndex: index,
            namespace: PINECONE_NAME_SPACE,
            textKey: 'text',
        });
    } catch (error) {
        console.log('error', error);
        throw new Error('Failed to ingest your data');
    }
};
