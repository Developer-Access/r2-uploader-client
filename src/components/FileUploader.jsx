import React, { useCallback, useRef, useState } from "react";
import axios from "axios";
import {
  DropZone,
  BlockStack,
  InlineStack,
  Text,
  Thumbnail,
  ProgressBar,
  Icon,
} from "@shopify/polaris";
import { FileIcon } from "@shopify/polaris-icons";

const MAX_CONCURRENT_UPLOADS = 3;

const FileUploader = () => {
  const [queue, setQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const activeUploads = useRef(0);
  const fileQueue = useRef([]);

  const uploadFile = async (file) => {
    const apiUrl = process.env.REACT_APP_API_URL;

    if (!apiUrl) {
      console.error(
        "REACT_APP_API_URL is not defined. Check your Vercel env vars."
      );
      return;
    }

    try {
      const { data } = await axios.post(`${apiUrl}/api/get-presigned-url`, {
        filename: file.name,
        type: file.type,
      });

      await axios.put(data.url, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (event) => {
          setProgress((prev) => ({
            ...prev,
            [file.name]: Math.round((event.loaded * 100) / event.total),
          }));
        },
      });
    } catch (err) {
      console.error(`❌ Failed to upload ${file.name}`, err.response || err);
    }
  };

  const processQueue = () => {
    while (
      activeUploads.current < MAX_CONCURRENT_UPLOADS &&
      fileQueue.current.length
    ) {
      const file = fileQueue.current.shift();
      activeUploads.current++;
      uploadFile(file).finally(() => {
        activeUploads.current--;
        processQueue();
      });
    }
  };

  const handleDrop = useCallback((_dropFiles, acceptedFiles) => {
    setQueue(acceptedFiles);
    fileQueue.current = [...acceptedFiles];
    setUploading(true);
    processQueue();
  }, []);

  const getFilePreview = (file) => {
    if (file.type.startsWith("image/")) {
      return (
        <Thumbnail
          size="small"
          source={URL.createObjectURL(file)}
          alt={file.name}
        />
      );
    } else {
      return <Icon source={FileIcon} tone="base" />;
    }
  };

  return (
    <BlockStack gap="400">
      <DropZone
        onDrop={handleDrop}
        allowMultiple
        fileTypes={["image/*", "application/pdf"]}
      >
        <DropZone.FileUpload actionHint="Drag and drop or click to upload multiple files." />
      </DropZone>

      {uploading && (
        <BlockStack gap="200">
          {queue.map((file) => (
            <InlineStack gap="200" align="center" key={file.name}>
              {getFilePreview(file)}
              <BlockStack gap="100" inlineAlign="start">
                <Text variant="bodyMd" as="p">
                  {file.name}
                </Text>
                <ProgressBar
                  progress={
                    typeof progress[file.name] === "number"
                      ? progress[file.name]
                      : 0
                  }
                  size="small"
                />
              </BlockStack>
            </InlineStack>
          ))}
        </BlockStack>
      )}
    </BlockStack>
  );
};

export default FileUploader;
