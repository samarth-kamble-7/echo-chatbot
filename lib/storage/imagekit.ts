export interface ImageKitUploadResult {
  fileId: string;
  url: string;
  name: string;
}

function getImageKitPrivateKey(): string | null {
  const key = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  return key ? key : null;
}

export function isImageKitConfigured(): boolean {
  return Boolean(getImageKitPrivateKey());
}

/**
 * Uploads a file (such as a PDF) to ImageKit Media Library using the REST Upload API.
 * Returns null if IMAGEKIT_PRIVATE_KEY is not configured.
 */
export async function uploadFileToImageKit(params: {
  file: File;
  fileName: string;
  folder?: string;
}): Promise<ImageKitUploadResult | null> {
  const privateKey = getImageKitPrivateKey();
  if (!privateKey) {
    return null;
  }

  const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("fileName", params.fileName);
  formData.append("useUniqueFileName", "true");
  if (params.folder) {
    formData.append("folder", params.folder);
  }

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `ImageKit upload failed (${response.status}): ${errorText || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    fileId: string;
    url: string;
    name: string;
  };

  return {
    fileId: data.fileId,
    url: data.url,
    name: data.name,
  };
}

/**
 * Deletes a previously uploaded file from ImageKit by fileId.
 * Fails silently with a warning if ImageKit is not configured or the file is already gone.
 */
export async function deleteFileFromImageKit(fileId: string): Promise<void> {
  const privateKey = getImageKitPrivateKey();
  if (!privateKey || !fileId) {
    return;
  }

  const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;

  try {
    const response = await fetch(
      `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      console.warn(`ImageKit delete returned ${response.status} for ${fileId}`);
    }
  } catch (err) {
    console.warn("Failed to delete file from ImageKit:", err);
  }
}
